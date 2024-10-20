// services/coach.service.js

const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const createToken = require('../utils/createToken');
const config = require('../config');
const decodeToken = require('../utils/decodeToken');
const sendMail = require('../utils/sendEmail');
const Mailgen = require('mailgen');
const formatNumberWithPrefix = require('../utils/formatNumberWithPrefix');
const hashPassword = require('../utils/hashPassword');
const crypto = require('crypto');

const inviteCoachHandler = async (data, loggedInUser) => {
  const { firstName, lastName, email, batchId, subRole } = data;

  const existingInvitation = await db.invitation.findFirst({
    where: {
      email,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (existingInvitation) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'An invitation has already been sent to this email.'
    );
  }

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'A user with this email already exists.'
    );
  }

  const tempPassword = crypto.randomBytes(8).toString('hex');
  const hashedPassword = await hashPassword(tempPassword, 10);

  const batch = await db.batch.findUnique({
    where: { id: batchId },
    select: {
      batchCode: true,
      description: true,
      academy: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!batch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
  }

  const academyName = batch.academy?.name;

  const coachInvitation = await db.invitation.create({
    data: {
      data: {
        firstName,
        lastName,
        batchId,
        email,
        subRole,
        password: hashedPassword,
        version: 1,
      },
      email,
      type: 'BATCH_COACH',
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      createdBy: {
        connect: {
          id: loggedInUser.id,
        },
      },
    },
    select: {
      id: true,
      email: true,
      type: true,
      status: true,
      data: true,
      createdBy: true,
      version: true,
    },
  });

  const token = await createToken(
    {
      id: coachInvitation.id,
      version: coachInvitation.version,
    },
    config.jwt.invitationSecret,
    '3d'
  );

  const ACTIVATION_URL = `${
    config.frontendUrl
  }/accept-invite?type=BATCH_COACH&name=${encodeURIComponent(
    `${batch.batchCode} as (${subRole}) from ${academyName}`
  )}&token=${token}`;

  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Chess in Chunks',
      link: config.frontendUrl,
    },
  });

  const emailContent = {
    body: {
      name: `${firstName} ${lastName}`,
      intro: `You are invited to join the academy "${academyName}" in the batch "${batch.batchCode}" as a coach (${subRole})!`,
      table: {
        data: [
          {
            label: 'Email',
            value: email,
          },
          {
            label: 'Temporary Password',
            value: tempPassword,
          },
        ],
      },
      action: {
        instructions:
          'To accept this invitation, please click the button below:',
        button: {
          color: '#22BC66',
          text: 'Accept Invitation',
          link: ACTIVATION_URL,
        },
      },
      outro: 'If you have any questions, feel free to reply to this email.',
    },
  };

  const emailBody = mailGenerator.generate(emailContent);
  const emailText = mailGenerator.generatePlaintext(emailContent);

  // Send the invitation email
  try {
    await sendMail(email, 'Batch Coach Invitation', emailText, emailBody);
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to send invitation email'
    );
  }

  return { coachInvitation };
};

const verifyCoachInvitationHandler = async (token) => {
  if (!token) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Token not present!');
  }

  const data = await decodeToken(token, config.jwt.invitationSecret);

  const coachInvitation = await db.invitation.findUnique({
    where: {
      id: data.id,
    },
    select: {
      id: true,
      data: true,
      type: true,
      status: true,
      version: true,
    },
  });

  if (!coachInvitation)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invitation not found!');

  if (coachInvitation.type !== 'BATCH_COACH') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token!');
  }

  if (coachInvitation.status === 'ACCEPTED') {
    throw new ApiError(
      httpStatus.ALREADY_REPORTED,
      'Invitation already accepted!'
    );
  }

  const { firstName, lastName, email, batchId, subRole, password, version } =
    coachInvitation.data;

  console.log(typeof version, typeof coachInvitation.version);

  if (typeof version !== typeof coachInvitation.version) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Invalid or expired invitation link.'
    );
  }

  const batch = await db.batch.findUnique({
    where: {
      id: batchId,
    },
    select: {
      id: true,
    },
  });

  if (!batch) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Batch not found!');
  }

  const coachProfile = await db.profile.create({
    data: {
      firstName,
      lastName,
    },
    select: {
      id: true,
    },
  });

  const userCount = await db.user.count();
  const newCode = formatNumberWithPrefix('U', userCount);

  const isEmailAlreadyExists = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (isEmailAlreadyExists) {
    throw new ApiError(httpStatus.CONFLICT, 'Email is already taken.');
  }

  const coach = await db.user.create({
    data: {
      email,
      profile: {
        connect: {
          id: coachProfile.id,
        },
      },
      code: newCode,
      coachOfBatches: {
        connect: [{ id: batch.id }],
      },
      role: 'COACH',
      subRole: subRole,
      password,
    },

    select: {
      id: true,
      email: true,
    },
  });

  const updatedBatch = await db.batch.update({
    where: {
      id: batchId,
    },
    data: {
      coaches: {
        connect: [{ id: coach.id }],
      },
    },
    select: {
      id: true,
    },
  });

  await db.invitation.delete({
    where: {
      id: coachInvitation.id,
    },
  });

  return {
    coach,
    updatedBatch,
  };
};

const fetchAllCoachesHandler = async (loggedInUser) => {
  const selectFields = {
    id: true,
    email: true,
    subRole: true,
    profile: {
      select: {
        firstName: true,
        middleName: true,
        lastName: true,
        dob: true,
        phoneNumber: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        parentName: true,
        parentEmailId: true,
      },
    },
    coachOfBatches: {
      select: {
        id: true,
        batchCode: true,
        description: true,
        studentCapacity: true,
        currentClass: true,
        currentLevel: true,
        academy: {
          select: {
            id: true,
            name: true,
          },
        },
        startDate: true,
        createdAt: true,
      },
    },
  };

  let coaches;

  if (loggedInUser.role === 'SUPER_ADMIN') {
    coaches = await db.user.findMany({
      where: {
        role: 'COACH',
      },
      select: selectFields,
    });
  } else if (loggedInUser.role === 'ADMIN') {
    const adminWithAcademies = await db.user.findUnique({
      where: { id: loggedInUser.id },
      select: {
        adminOfAcademies: {
          select: {
            id: true,
          },
        },
      },
    });

    if (
      !adminWithAcademies ||
      adminWithAcademies.adminOfAcademies.length === 0
    ) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Admin is not associated with any academy'
      );
    }

    const academyIds = adminWithAcademies.adminOfAcademies.map(
      (academy) => academy.id
    );

    coaches = await db.user.findMany({
      where: {
        role: 'COACH',
        coachOfBatches: {
          some: {
            academyId: { in: academyIds },
          },
        },
      },
      select: selectFields,
    });
  }

  return coaches;
};

const coachService = {
  inviteCoachHandler,
  verifyCoachInvitationHandler,
  fetchAllCoachesHandler,
};

module.exports = coachService;
