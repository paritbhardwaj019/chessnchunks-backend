const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const {
  REGISTRATION_STAGE,
  SIGNUP_STATUS,
  SYSTEM_CODE_MODULE,
  ROLE,
} = require('@prisma/client');
const generateSystemCode = require('../utils/generateSystemCode');
const config = require('../config');
const Mailgen = require('mailgen');
const createToken = require('../utils/createToken');
const sendMail = require('../utils/sendEmail');

const validateBatchCapacity = async (batchId) => {
  const batch = await db.batch.findUnique({
    where: { id: batchId },
    include: {
      _count: {
        select: { students: true },
      },
    },
  });

  if (!batch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
  }

  if (batch._count.students >= batch.studentCapacity) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Batch has reached maximum capacity'
    );
  }

  return batch;
};

const sendSignupEmail = async (signup) => {
  const token = await createToken(
    {
      id: signup.id,
      email: signup.email,
    },
    config.jwt.invitationSecret,
    '3d'
  );

  const ACTIVATION_URL = `${config.chessinChunksUrl}/complete-signup?token=${token}&id=${signup.id}`;

  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Chess in Chunks',
      link: config.frontendUrl,
    },
  });

  const emailContent = {
    body: {
      name: `${signup.firstName} ${signup.lastName}`,
      intro: [
        'Welcome to Chess in Chunks!',
        'Your signup process has been initiated successfully.',
        'Important: You have 72 hours to complete your registration by making the payment.',
      ],
      action: {
        instructions:
          'Please click the button below to complete your registration:',
        button: {
          color: '#22BC66',
          text: 'Complete Registration',
          link: ACTIVATION_URL,
        },
      },
      outro: [
        'Please note: This link will expire in 72 hours.',
        'If you do not complete the payment within this time, you will need to sign up again.',
        'If you have any questions, feel free to reply to this email.',
      ],
    },
  };

  if (signup.interestedBatch) {
    emailContent.body.dictionary = {
      'Selected Batch': signup.interestedBatch.batchCode,
      'Batch Day': signup.interestedBatch.batchDay,
      'Start Time': signup.interestedBatch.startTime,
      'Start Date': new Date(
        signup.interestedBatch.startDate
      ).toLocaleDateString(),
    };
  }

  const emailBody = mailGenerator.generate(emailContent);
  const emailText = mailGenerator.generatePlaintext(emailContent);

  await sendMail(
    signup.email,
    'Complete Your Chess in Chunks Registration',
    emailText,
    emailBody
  );
};

const createSignupHandler = async (data, academyId) => {
  const {
    email,
    firstName,
    middleName,
    lastName,
    dateOfBirth,
    parentName,
    parentEmail,
    phoneNumber,
    addressLine1,
    addressLine2,
    city,
    state,
    country,
    zipCode,
    batchInterestId,
  } = data;

  const existingSignup = await db.userSignup.findUnique({
    where: { email },
  });

  if (existingSignup) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Email already registered for signup'
    );
  }

  await validateBatchCapacity(batchInterestId);

  const signupId = await generateSystemCode(SYSTEM_CODE_MODULE.STUDENT);

  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 72);

  const signup = await db.userSignup.create({
    data: {
      email,
      signupId,
      firstName,
      middleName,
      lastName,
      userRole: ROLE.STUDENT,
      dateOfBirth: new Date(dateOfBirth),
      parentName,
      parentEmail,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      zipCode,
      signupStage: REGISTRATION_STAGE.INQUIRY,
      signupStatus: SIGNUP_STATUS.INQUIRY,
      interestedBatch: batchInterestId
        ? {
            connect: {
              id: batchInterestId,
            },
          }
        : undefined,
      academy: academyId
        ? {
            connect: {
              id: academyId,
            },
          }
        : undefined,
      reservationExpiry: expiryDate,
    },
    include: {
      interestedBatch: true,
      academy: true,
    },
  });

  await sendSignupEmail(signup);

  return signup;
};

const updateSignupHandler = async (id, data) => {
  const signup = await db.userSignup.findUnique({
    where: { id },
  });

  if (!signup) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Signup not found');
  }

  const updatedSignup = await db.userSignup.update({
    where: { id },
    data: {
      ...data,
      ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
    },
    include: {
      interestedBatch: true,
      academy: true,
    },
  });

  return updatedSignup;
};

const verifyEmailHandler = async (id) => {
  const signup = await db.userSignup.update({
    where: { id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      signupStage: REGISTRATION_STAGE.PRE_ACTIVATION,
    },
  });

  return signup;
};

const setReservationHandler = async (id, expiryHours = 24) => {
  const reservationTime = new Date();
  const reservationExpiry = new Date(
    reservationTime.getTime() + expiryHours * 60 * 60 * 1000
  );

  const signup = await db.userSignup.update({
    where: { id },
    data: {
      signupStatus: SIGNUP_STATUS.RESERVED,
      reservationTime,
      reservationExpiry,
    },
  });

  return signup;
};

const confirmSignupHandler = async (id, userId) => {
  const signup = await db.userSignup.update({
    where: { id },
    data: {
      signupStatus: SIGNUP_STATUS.CONFIRMED,
      userId,
      signupStage: REGISTRATION_STAGE.POST_ACTIVATION,
    },
    include: {
      interestedBatch: true,
      academy: true,
    },
  });

  return signup;
};

const fetchAllSignupsHandler = async (filters = {}) => {
  const where = {};

  if (filters.academyId) {
    where.academyId = filters.academyId;
  }

  if (filters.status) {
    where.signupStatus = filters.status;
  }

  if (filters.stage) {
    where.signupStage = filters.stage;
  }

  const signups = await db.userSignup.findMany({
    where,
    include: {
      interestedBatch: true,
      academy: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: filters.page ? (filters.page - 1) * filters.limit : undefined,
    take: filters.limit ? Number(filters.limit) : undefined,
  });

  return signups;
};

const fetchSignupByIdHandler = async (id) => {
  const signup = await db.userSignup.findUnique({
    where: { id },
    include: {
      interestedBatch: true,
      academy: true,
      user: {
        select: {
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!signup) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Signup not found');
  }

  return signup;
};

const handleWaitlistHandler = async (batchId) => {
  const waitingSignups = await db.userSignup.findMany({
    where: {
      batchInterestId: batchId,
      signupStatus: SIGNUP_STATUS.WAITING,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return waitingSignups;
};

const addProgramPurchaseHandler = async (userId, programData) => {
  const { programId, appliedCredit, appliedDiscount, academyId } = programData;

  const program = await db.academyProgram.findFirst({
    where: {
      id: programId,
      isActive: true,
      academyId,
    },
  });

  if (!program) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Program not found or is not active'
    );
  }

  const finalPrice =
    program.price - (appliedCredit || 0) - (appliedDiscount || 0);

  if (finalPrice < 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Applied credits and discounts cannot exceed program price'
    );
  }

  const cartItem = await db.cartItem.create({
    data: {
      userId,
      programId,
      appliedCredit,
      appliedDiscount,
      finalPrice,
      status: 'PENDING',
    },
    include: {
      program: true,
      user: {
        select: {
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return cartItem;
};

const checkoutSessionHandler = async (userId, cartItemIds) => {
  const cartItems = await db.cartItem.findMany({
    where: {
      id: { in: cartItemIds },
      userId,
      status: 'PENDING',
    },
    include: {
      program: true,
    },
  });

  if (cartItems.length !== cartItemIds.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'One or more cart items are invalid or not accessible'
    );
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + item.finalPrice, 0);

  const subscriptions = await Promise.all(
    cartItems.map(async (item) => {
      const endDate =
        item.program.duration === 'MONTHLY'
          ? new Date(new Date().setMonth(new Date().getMonth() + 1))
          : new Date(new Date().setMonth(new Date().getMonth() + 4));

      return db.studentSubscription.create({
        data: {
          userId,
          academyPlanId: item.programId,
          startDate: new Date(),
          endDate,
          status: 'ACTIVE',
          autoRenew: true,
          paymentStatus: 'PENDING',
        },
      });
    })
  );

  await db.cartItem.updateMany({
    where: {
      id: { in: cartItemIds },
    },
    data: {
      status: 'COMPLETED',
    },
  });

  await Promise.all(
    cartItems.map(async (item) => {
      if (item.program.creditPoints) {
        await db.studentProgramCredit.create({
          data: {
            userId,
            programId: item.programId,
            pointsEarned: item.program.creditPoints,
            isRedeemed: false,
          },
        });
      }
    })
  );

  return {
    cartItems,
    totalAmount,
    subscriptions,
  };
};

const getProgramCreditsHandler = async (userId) => {
  const credits = await db.studentProgramCredit.findMany({
    where: {
      userId,
      isRedeemed: false,
    },
    include: {
      program: true,
    },
  });

  return credits;
};

const getActiveSubscriptionsHandler = async (userId) => {
  const subscriptions = await db.studentSubscription.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: {
      academyPlan: true,
    },
  });

  return subscriptions;
};

const handleExpiredSignups = async () => {
  const expiredSignups = await db.userSignup.findMany({
    where: {
      reservationExpiry: {
        lt: new Date(),
      },
      signupStatus: {
        in: [SIGNUP_STATUS.INQUIRY, SIGNUP_STATUS.RESERVED],
      },
      paymentStatus: {
        not: PAYMENT_STATUS.COMPLETED,
      },
    },
  });

  for (const signup of expiredSignups) {
    const mailGenerator = new Mailgen({
      theme: 'default',
      product: {
        name: 'Chess in Chunks',
        link: config.frontendUrl,
      },
    });

    const emailContent = {
      body: {
        name: `${signup.firstName} ${signup.lastName}`,
        intro: 'Your Chess in Chunks registration has expired',
        message:
          'The 72-hour period to complete your registration has elapsed. If you still wish to join, please sign up again.',
        outro: 'We hope to see you back soon!',
      },
    };

    const emailBody = mailGenerator.generate(emailContent);
    const emailText = mailGenerator.generatePlaintext(emailContent);

    try {
      await sendMail(
        signup.email,
        'Chess in Chunks Registration Expired',
        emailText,
        emailBody
      );
    } catch (error) {
      logger.error(
        `Failed to send expiration email to ${signup.email}:`,
        error
      );
    }

    await db.userSignup.update({
      where: { id: signup.id },
      data: {
        signupStatus: SIGNUP_STATUS.EXPIRED,
      },
    });
  }

  return expiredSignups.length;
};

const studentSignupService = {
  createSignupHandler,
  updateSignupHandler,
  verifyEmailHandler,
  setReservationHandler,
  confirmSignupHandler,
  fetchAllSignupsHandler,
  fetchSignupByIdHandler,
  handleWaitlistHandler,
  checkoutSessionHandler,
  getProgramCreditsHandler,
  getActiveSubscriptionsHandler,
  addProgramPurchaseHandler,
  handleExpiredSignups,
};

module.exports = studentSignupService;
