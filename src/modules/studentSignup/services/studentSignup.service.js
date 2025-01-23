const {
  REGISTRATION_STAGE,
  SIGNUP_STATUS,
  SYSTEM_CODE_MODULE,
  ROLE,
  PAYMENT_STATUS,
} = require('@prisma/client');
const ChessWebAPI = require('chess-web-api');
const httpStatus = require('http-status');
const Mailgen = require('mailgen');
const logger = require('../../../utils/logger');
const config = require('../../../config');
const stripe = require('../../../config/stripe');
const db = require('../../../database/prisma');
const ApiError = require('../../../utils/apiError');
const createToken = require('../../../utils/createToken');
const { generateOTP } = require('../../../utils/generateOTP');
const generateSystemCode = require('../../../utils/generateSystemCode');
const { getDomainFromAdmin } = require('../../../utils/getDomainFromAdmin');
const sendMail = require('../../../utils/sendEmail');

const chessAPI = new ChessWebAPI();

const setupMFAHandler = async (signupId) => {
  const signup = await db.userSignup.findUnique({
    where: { id: signupId },
    include: {
      user: true,
    },
  });

  if (!signup) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Signup not found');
  }

  const otp = generateOTP(6);
  const otpExpiryTime = new Date();
  otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 10);

  await db.signupOTP.upsert({
    where: { email: signup.email },
    update: {
      otp,
      expiresAt: otpExpiryTime,
      verified: false,
    },
    create: {
      email: signup.email,
      otp,
      expiresAt: otpExpiryTime,
      verified: false,
    },
  });

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
      intro: 'MFA Setup Verification',
      dictionary: {
        'Your verification code': otp,
      },
      outro: [
        'This code will expire in 10 minutes.',
        'If you did not request this code, please ignore this email.',
      ],
    },
  };

  const emailBody = mailGenerator.generate(emailContent);
  const emailText = mailGenerator.generatePlaintext(emailContent);

  await sendMail(
    signup.email,
    'MFA Setup Verification Code',
    emailText,
    emailBody
  );

  await db.userSignup.update({
    where: { id: signupId },
    data: {
      mfaEnabled: true,
    },
  });

  return {
    message:
      'MFA setup initiated. Please check your email for the verification code.',
  };
};

const verifyMFAHandler = async (signupId, otp) => {
  const signup = await db.userSignup.findUnique({
    where: { id: signupId },
    include: {
      user: true,
    },
  });

  if (!signup || !signup.mfaEnabled) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'MFA not enabled for this signup'
    );
  }

  const otpRecord = await db.signupOTP.findUnique({
    where: { email: signup.email },
  });

  if (!otpRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No OTP found for verification');
  }

  if (otpRecord.verified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP already verified');
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP has expired');
  }

  if (otpRecord.otp !== otp) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid OTP');
  }

  await db.signupOTP.update({
    where: { email: signup.email },
    data: {
      verified: true,
    },
  });

  await db.userSignup.update({
    where: { id: signupId },
    data: {
      mfaVerified: true,
    },
  });

  return {
    verified: true,
    message: 'MFA successfully enabled',
  };
};

const generateMFALoginOTP = async (email) => {
  const otp = generateOTP(6);
  const otpExpiryTime = new Date();
  otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 10);

  await db.signupOTP.upsert({
    where: { email },
    update: {
      otp,
      expiresAt: otpExpiryTime,
      verified: false,
    },
    create: {
      email,
      otp,
      expiresAt: otpExpiryTime,
      verified: false,
    },
  });

  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Chess in Chunks',
      link: config.frontendUrl,
    },
  });

  const emailContent = {
    body: {
      intro: 'Login Verification Code',
      dictionary: {
        'Your verification code': otp,
      },
      outro: [
        'This code will expire in 10 minutes.',
        'If you did not request this code, please secure your account immediately.',
      ],
    },
  };

  const emailBody = mailGenerator.generate(emailContent);
  const emailText = mailGenerator.generatePlaintext(emailContent);

  await sendMail(email, 'Login Verification Code', emailText, emailBody);

  return {
    message: 'MFA verification code sent to your email',
  };
};

const updatePasswordHandler = async (id, newPassword) => {
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required');
  }

  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Password must be at least 6 characters long'
    );
  }

  const existingUser = await db.userSignup.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const updatedUser = await db.userSignup.update({
    where: { id },
    data: { password: newPassword },
    select: { id: true, email: true },
  });

  return updatedUser;
};

const validateChessComUsername = async (username) => {
  try {
    await chessAPI.getPlayer(username);
    return true;
  } catch (error) {
    if (error.statusCode === 404) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Invalid Chess.com username. Please check and try again.'
      );
    }
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Unable to verify Chess.com username at the moment. Please try again later.'
    );
  }
};

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

const sendSignupEmail = async (signup, otp) => {
  const token = await createToken(
    {
      id: signup.id,
      email: signup.email,
    },
    config.jwt.invitationSecret,
    '3d'
  );

  const domain = getDomainFromAdmin(signup.academy.domain);

  const ACTIVATION_URL = `${domain}/complete-signup?token=${token}&id=${signup.id}`;

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
      otp: otp,
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
    chessComId,
    lichessId,
    uscfId,
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

  'CHESS COM ID', chessComId;

  if (chessComId) {
    await validateChessComUsername(chessComId);
  }

  await validateBatchCapacity(batchInterestId);

  const otp = generateOTP(6);
  const otpExpiryTime = new Date();
  otpExpiryTime.setHours(otpExpiryTime.getHours() + 72);

  await db.signupOTP.upsert({
    where: { email },
    update: {
      otp,
      expiresAt: otpExpiryTime,
      verified: false,
    },
    create: {
      email,
      otp,
      expiresAt: otpExpiryTime,
      verified: false,
    },
  });

  const signupId = await generateSystemCode(SYSTEM_CODE_MODULE.USER_SIGNUP);

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
      chessComId,
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
      lichessId,
      uscfId,
    },
    include: {
      interestedBatch: true,
      academy: true,
    },
  });

  await sendSignupEmail(signup, otp);

  return signup;
};

const updateSignupHandler = async (id, data) => {
  const signup = await db.userSignup.findUnique({
    where: { id },
  });

  if (!signup) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Signup not found');
  }

  if (data.mfaEnabled !== undefined) {
    if (data.mfaEnabled && !signup.mfaSecret) {
      const mfaSetup = await setupMFAHandler(id);
      return {
        ...signup,
        mfaEnabled: true,
        mfaQrCode: mfaSetup.qrCode,
        mfaSecret: mfaSetup.secret,
      };
    } else if (!data.mfaEnabled) {
      data.mfaSecret = null;
      data.mfaVerified = false;
    }
  }

  const filteredData = Object.fromEntries(
    Object.entries(data).filter(
      ([_, value]) => value !== undefined && value !== null // eslint-disable-line no-unused-vars
    )
  );

  if (filteredData.dateOfBirth) {
    filteredData.dateOfBirth = new Date(filteredData.dateOfBirth);
  }

  const updatedSignup = await db.userSignup.update({
    where: { id },
    data: filteredData,
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

  'FILTERS', filters;

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
  const otpRecord = await db.signupOTP.findUnique({
    where: { email: signup.email },
  });

  return {
    ...signup,
    otp: otpRecord?.otp || null,
  };
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

const checkoutSessionHandler = async (
  programId,
  userEmail,
  billingPeriod = 'monthly'
) => {
  const program = await db.academyProgram.findFirst({
    where: {
      id: programId,
      isActive: true,
    },
    include: {
      academy: true,
    },
  });

  if (!program) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Program not found or is not active'
    );
  }

  const domain = getDomainFromAdmin(program.academy.domain);

  let finalPrice;
  let interval;
  let description = program.description || '';

  switch (billingPeriod) {
    case 'seasonal':
      finalPrice = program.seasonPrice;
      interval = 'month';
      description += '\nSeasonal pricing applied';
      break;

    case 'yearly': {
      const yearlyPrice = program.monthlyPrice * 12;
      const discountAmount =
        (yearlyPrice * program.yearlyDiscountPercentage) / 100;
      finalPrice = yearlyPrice - discountAmount;
      interval = 'year';
      description += `\nIncludes ${program.yearlyDiscountPercentage}% yearly discount`;
      break;
    }

    default:
      finalPrice = program.monthlyPrice;
      interval = 'month';
      break;
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${program.name} - ${
              billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1)
            } Plan`,
            description: description,
          },
          unit_amount: Math.round(finalPrice * 100),
          recurring: {
            interval: interval,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      programId: programId,
      userEmail,
      type: 'STUDENT',
      billingPeriod,
      seasonPrice: program.seasonPrice.toString(),
      monthlyPrice: program.monthlyPrice.toString(),
      yearlyDiscountPercentage: program.yearlyDiscountPercentage.toString(),
      finalPrice: finalPrice.toString(),
    },
    mode: 'subscription',
    success_url: `${domain}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domain}/checkout/cancel`,
  });

  return {
    sessionId: session.id,
    sessionUrl: session.url,
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
  updatePasswordHandler,
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
  sendSignupEmail,
  setupMFAHandler,
  verifyMFAHandler,
  generateMFALoginOTP,
};

module.exports = studentSignupService;
