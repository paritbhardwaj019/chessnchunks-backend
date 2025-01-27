const {
  COACH_ROLE,
  REGISTRATION_STAGE,
  SIGNUP_STATUS,
  USER_STATUS,
  ROLE,
  SYSTEM_CODE_MODULE,
} = require('@prisma/client');
const Mailgen = require('mailgen');
const config = require('../../../config');
const db = require('../../../database/prisma');
const httpStatus = require('http-status');
const ApiError = require('../../../utils/apiError');
const hashPassword = require('../../../utils/hashPassword');
const generateSystemCode = require('../../../utils/generateSystemCode');
const {
  validateChessComUsername,
} = require('../../studentSignup/services/studentSignup.service');
const { generateOTP } = require('../../../utils/generateOTP');
const createToken = require('../../../utils/createToken');
const sendMail = require('../../../utils/sendEmail');

const mailGenerator = new Mailgen({
  theme: 'default',
  product: {
    name: 'Chess in Chunks',
    link: config.frontendUrl,
  },
});

async function initiateCoachSignup(data, academyId) {
  const existingSignup = await db.userSignup.findUnique({
    where: { email: data.email },
  });

  if (existingSignup) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email already registered for signup'
    );
  }

  if (data.chessComId) {
    const isValidChessComUsername = await validateChessComUsername(
      data.chessComId
    );
    if (!isValidChessComUsername) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Invalid Chess.com username. Please provide a valid Chess.com username.'
      );
    }
  }

  if (data.assignBatchId) {
    const batch = await db.batch.findUnique({
      where: { id: data.assignBatchId },
    });

    if (!batch) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Invalid batch ID. Please select a valid batch.'
      );
    }
  }

  const signupId = await generateSystemCode(SYSTEM_CODE_MODULE.USER_SIGNUP);

  const signup = await db.userSignup.create({
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      phoneNumber: data.phoneNumber,
      dateOfBirth: new Date(data.dateOfBirth),
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      country: data.country,
      zipCode: data.zipCode,
      chessComId: data.chessComId,
      lichessId: data.lichessId,
      uscfId: data.uscfId,
      assignedToBatch: {
        connect: {
          id: data.assignBatchId,
        },
      },
      signupStage: REGISTRATION_STAGE.INQUIRY,
      signupStatus: SIGNUP_STATUS.INQUIRY,
      userRole: ROLE.COACH,
      coachType: data.coachType,
      academy: {
        connect: {
          id: academyId,
        },
      },
      signupId,
    },
  });

  await sendCoachInvitationEmail(data.email, signup.id, academyId);

  return signup;
}

async function sendCoachInvitationEmail(email, signupId, academyId) {
  const otp = generateOTP(6);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.signupOTP.upsert({
    where: { email },
    update: { otp, expiresAt },
    create: { email, otp, expiresAt },
  });

  const academy = await db.academy.findUnique({ where: { id: academyId } });
  const token = createToken({ signupId }, config.jwt.invitationSecret, '7d');

  const emailContent = {
    body: {
      name: 'Coach',
      intro: `You've been invited to join ${academy.name} as a coach!`,
      action: {
        instructions: 'Use the following OTP to completed your registration:',
        button: {
          color: '#22BC66',
          text: otp,
          link: '#',
        },
      },
      outro: [
        `Or use this registration link: ${config.frontendUrl}/coach-signup?token=${token}`,
        'This invitation expires in 24 hours.',
      ],
    },
  };

  const emailBody = mailGenerator.generate(emailContent);
  const emailText = mailGenerator.generatePlaintext(emailContent);

  await sendMail(
    email,
    'Coach Invitation - Chess in Chunks',
    emailText,
    emailBody
  );
}

async function updateCoachSignup(signupId, data) {
  const signup = await db.userSignup.findUnique({
    where: { id: signupId },
  });

  if (!signup) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Signup not found');
  }

  if (data.assignBatchId) {
    const batch = await db.batch.findUnique({
      where: { id: data.assignBatchId },
    });

    if (!batch) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Invalid batch ID. Please select a valid batch.'
      );
    }
  }

  const updateData = {
    ...data,
    ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
  };

  delete updateData.assignBatchId;

  const updatedSignup = await db.userSignup.update({
    where: { id: signupId },
    data: {
      ...updateData,
      ...(data.assignBatchId && {
        assignedToBatch: {
          connect: {
            id: data.assignBatchId,
          },
        },
      }),
    },
    include: {
      academy: true,
      invitation: true,
    },
  });

  return updatedSignup;
}

async function verifyCoachSignupOTP(email, otp) {
  const signup = await db.userSignup.findUnique({
    where: { email },
    include: { invitation: true },
  });

  const otpRecord = await db.signupOTP.findUnique({
    where: { email: signup.email },
  });

  if (!otpRecord || otpRecord.otp !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP');
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP has expired');
  }

  let newStage = signup.signupStage;
  switch (signup.signupStage) {
    case REGISTRATION_STAGE.INQUIRY:
      newStage = REGISTRATION_STAGE.PRE_ACTIVATION;
      break;
    case REGISTRATION_STAGE.PRE_ACTIVATION:
      newStage = REGISTRATION_STAGE.PAYMENT;
      break;
    case REGISTRATION_STAGE.PAYMENT:
      newStage = REGISTRATION_STAGE.POST_ACTIVATION;
      break;
    default:
      break;
  }

  const updatedSignup = await db.userSignup.update({
    where: { email },
    data: {
      signupStage: newStage,
      ...(newStage === REGISTRATION_STAGE.POST_ACTIVATION && {
        signupStatus: SIGNUP_STATUS.CONFIRMED,
      }),
    },
  });

  await db.signupOTP.delete({ where: { email: signup.email } });

  return updatedSignup;
}

async function completeCoachSignup(
  signupId,
  password,
  profileData,
  loggedInUser
) {
  if (!signupId || !password || !profileData || !loggedInUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }

  const signup = await db.userSignup.findUnique({
    where: { id: signupId },
    include: { academy: true },
  });

  if (!signup) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Signup not found');
  }

  if (signup.signupStage !== REGISTRATION_STAGE.POST_ACTIVATION) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Signup is not ready for completion'
    );
  }

  const hashedPassword = await hashPassword(password, 12);

  const user = await db.user.create({
    data: {
      email: signup.email,
      status: USER_STATUS.ACTIVE,
      subRole: signup.coachType || COACH_ROLE.HEAD_COACH,
      role: { connect: { name: ROLE.COACH } },
      academy: signup.academyId
        ? { connect: { id: signup.academyId } }
        : undefined,
      profile: {
        create: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          middleName: profileData.middleName || null,
          dateOfBirth: profileData.dateOfBirth
            ? new Date(profileData.dateOfBirth)
            : null,
          phoneNumber: profileData.phoneNumber,
          addressLine1: profileData.addressLine1,
          addressLine2: profileData.addressLine2 || null,
          city: profileData.city,
          state: profileData.state,
          country: profileData.country,
          zipCode: profileData.zipCode,
          chessComId: profileData.chessComId || null,
          lichessId: profileData.lichessId || null,
          uscfId: profileData.uscfId || null,
        },
      },
      password: hashedPassword,
    },
    include: { profile: true },
  });

  const updateData = {
    signupStatus: SIGNUP_STATUS.COMPLETED,
    user: { connect: { id: user.id } },
  };

  if (
    loggedInUser &&
    (loggedInUser.role === 'ADMIN' || loggedInUser.role === 'MASTER_ADMIN')
  ) {
    updateData.completedBy = { connect: { id: loggedInUser.id } };
  }

  await db.userSignup.update({
    where: { id: signupId },
    data: updateData,
  });

  return user;
}
async function getCoachSignupById(signupId) {
  if (!signupId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Signup ID is required');
  }

  const signup = await db.userSignup.findUnique({
    where: { id: signupId },
    include: {
      academy: true,
      invitation: true,
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!signup) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Coach signup not found');
  }

  return signup;
}

async function fetchAllCoachSignups({
  page = 1,
  limit = 10,
  search = '',
  status,
  stage,
  academyId,
}) {
  if (page < 1 || limit < 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Page and limit must be greater than 0'
    );
  }

  const where = {
    userRole: ROLE.COACH,
    ...(search && {
      OR: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ],
    }),
    ...(status && { signupStatus: status }),
    ...(stage && { signupStage: stage }),
    ...(academyId && { academyId }),
  };

  const signups = await db.userSignup.findMany({
    where,
    include: {
      academy: true,
      invitation: true,
      user: {
        include: {
          profile: true,
        },
      },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  const total = await db.userSignup.count({ where });

  return {
    data: signups,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

const coachSignupService = {
  initiateCoachSignup,
  updateCoachSignup,
  verifyCoachSignupOTP,
  completeCoachSignup,
  getCoachSignupById,
  fetchAllCoachSignups,
};

module.exports = coachSignupService;
