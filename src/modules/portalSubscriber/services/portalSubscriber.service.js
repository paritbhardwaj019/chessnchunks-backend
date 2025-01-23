const ChessWebAPI = require('chess-web-api');
const httpStatus = require('http-status');
const Mailgen = require('mailgen');
const config = require('../../../config');
const db = require('../../../database/prisma');
const ApiError = require('../../../utils/apiError');
const { uploadToCloudinary } = require('../../../utils/cloudinary.utils');
const createToken = require('../../../utils/createToken');
const { generateOTP } = require('../../../utils/generateOTP');
const hashPassword = require('../../../utils/hashPassword');
const sendMail = require('../../../utils/sendEmail');
const stripe = require('../../../config/stripe');

const chessAPI = new ChessWebAPI();

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

const sendVerificationEmail = async (signup, otp) => {
  const token = await createToken(
    {
      id: signup.id,
      email: signup.email,
    },
    config.jwt.invitationSecret,
    '72h'
  );

  const ACTIVATION_URL = `${config.chessinChunksUrl}/complete-signup?type=PORTAL_SUBSCRIBER&token=${token}&id=${signup.id}`;

  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Chess in Chunks',
      link: config.chessinChunksUrl,
    },
  });

  const emailContent = {
    body: {
      name: `${signup.firstName} ${signup.lastName}`,
      intro: [
        'Welcome to Chess in Chunks!',
        'Your portal subscriber signup has been initiated successfully.',
        'Please verify your email to continue the registration process.',
      ],
      action: {
        instructions: 'Please click the button below to verify your email:',
        button: {
          color: '#22BC66',
          text: 'Accept Invitation',
          link: ACTIVATION_URL,
        },
      },
      dictionary: {
        'Email Verification Code': otp,
      },
      outro: [
        'Please verify your email within 72 hours.',
        'If you have any questions, feel free to reply to this email.',
      ],
    },
  };

  const emailBody = mailGenerator.generate(emailContent);
  const emailText = mailGenerator.generatePlaintext(emailContent);

  await sendMail(
    signup.email,
    'Verify Your Chess in Chunks Portal Subscription',
    emailText,
    emailBody
  );
};

const createPortalSignupHandler = async (data) => {
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
    chessComId,
    cicId,
  } = data;

  const requiredFields = [
    'email',
    'firstName',
    'lastName',
    'dateOfBirth',
    'phoneNumber',
    'addressLine1',
    'city',
    'state',
    'country',
    'chessComId',
    'cicId',
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      throw new ApiError(httpStatus.BAD_REQUEST, `${field} is required`);
    }
  }

  const existingUser = await db.userSignup.findFirst({
    where: {
      OR: [{ email }, { cicId }, { chessComId }],
    },
  });

  if (existingUser) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'Account with this email, CIC ID, or Chess.com ID already exists'
    );
  }

  const age = Math.floor(
    (new Date() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)
  );
  if (age < 18 && (!parentName || !parentEmail)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Parent name and email are required for users under 18'
    );
  }

  await validateChessComUsername(chessComId);

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

  const defaultAcademy = await db.academy.findFirst({
    where: { isDefault: true },
  });

  if (!defaultAcademy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Default academy not found');
  }

  const signup = await db.userSignup.create({
    data: {
      email,
      signupId: cicId,
      firstName,
      middleName,
      lastName,
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
      cicId,
      signupStage: 'INQUIRY',
      signupStatus: 'INQUIRY',
      mfaEnabled: false,
      userRole: 'SUBSCRIBER',
    },
    include: {
      academy: true,
    },
  });

  await sendVerificationEmail(signup, otp);

  return signup;
};

const verifyPortalSignupEmail = async (id, otp) => {
  const signup = await db.userSignup.findUnique({
    where: { id },
  });

  if (!signup) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Signup not found');
  }

  const otpRecord = await db.signupOTP.findUnique({
    where: { email: signup.email },
  });

  if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiresAt < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
  }

  const verifiedSignup = await db.userSignup.update({
    where: { id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      signupStage: 'PRE_ACTIVATION',
    },
  });

  return verifiedSignup;
};

const completePortalSignup = async (id, data) => {
  const { password, userImage } = data;

  if (!password) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password is required');
  }

  const signup = await db.userSignup.findUnique({
    where: { id },
    include: {
      academy: true,
    },
  });

  if (!signup) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Signup not found');
  }

  let imageUrl = signup.profileImage;
  if (userImage) {
    const uploadResult = await uploadToCloudinary(userImage, {
      folder: 'user-images',
      publicId: `user-${Date.now()}`,
      allowedFormats: ['jpg', 'jpeg', 'png'],
    });
    imageUrl = uploadResult.url;
  }

  const hashedPassword = await hashPassword(password, 10);

  const profile = await db.profile.create({
    data: {
      firstName: signup.firstName,
      lastName: signup.lastName,
      middleName: signup.middleName,
      dateOfBirth: signup.dateOfBirth,
      phoneNumber: signup.phoneNumber,
      addressLine1: signup.addressLine1,
      addressLine2: signup.addressLine2,
      city: signup.city,
      state: signup.state,
      country: signup.country,
      parentName: signup.parentName,
      parentEmail: signup.parentEmail,
      chessComId: signup.chessComId,
      imageUrl,
    },
  });

  const role = await db.role.findUnique({
    where: { name: 'SUBSCRIBER' },
  });

  const user = await db.user.create({
    data: {
      email: signup.email,
      password: hashedPassword,
      status: 'ACTIVE',
      mfaEnabled: signup.mfaEnabled,
      code: signup.cicId,
      roleId: role.id,
      subRole: signup.coachType,
      profile: {
        connect: { id: profile.id },
      },
      assignedToAcademy: {
        connect: { id: signup.academyId },
      },
    },
  });

  await db.userSignup.update({
    where: { id },
    data: {
      userId: user.id,
      signupStage: 'POST_ACTIVATION',
      signupStatus: 'CONFIRMED',
    },
  });

  return user;
};

const checkEmailAvailability = async (email) => {
  const existingUser = await db.userSignup.findFirst({
    where: { email },
  });
  return !existingUser;
};

const checkCicIdAvailability = async (cicId) => {
  const existingUser = await db.userSignup.findFirst({
    where: { cicId },
  });
  return !existingUser;
};

const checkChessComIdAvailability = async (chessComId) => {
  const existingUser = await db.userSignup.findFirst({
    where: { chessComId },
  });
  return !existingUser;
};

const updatePortalSignupHandler = async (id, data) => {
  const signup = await db.userSignup.findUnique({
    where: { id },
  });

  if (!signup) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Signup not found');
  }

  // Don't allow updates to certain fields after verification
  if (signup.emailVerified) {
    const restrictedFields = [
      'email',
      'cicId',
      'firstName',
      'lastName',
      'dateOfBirth',
    ];
    const attemptedRestrictedUpdate = restrictedFields.some(
      (field) => data[field] !== undefined
    );

    if (attemptedRestrictedUpdate) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Cannot update email, CIC ID, name or date of birth after verification'
      );
    }
  }

  // Handle date conversion if dateOfBirth is included
  const updateData = {
    ...data,
    ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
  };

  const updatedSignup = await db.userSignup.update({
    where: { id },
    data: updateData,
    include: {
      academy: true,
      user: {
        select: {
          email: true,
          profile: true,
        },
      },
    },
  });

  return updatedSignup;
};

const fetchPortalSignupByIdHandler = async (id) => {
  const signup = await db.userSignup.findUnique({
    where: { id },
    include: {
      academy: true,
      user: {
        select: {
          email: true,
          profile: true,
          role: true,
          status: true,
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

const listAllPortalSubscribersForAdmin = async (
  page = 1,
  limit = 10,
  filters = {}
) => {
  const where = {
    academy: {
      isDefault: true,
    },
  };

  // Add search filters
  if (filters.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { cicId: { contains: filters.search, mode: 'insensitive' } },
      { chessComId: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  // Add status filter
  if (filters.status) {
    where.signupStatus = filters.status;
  }

  // Add stage filter
  if (filters.stage) {
    where.signupStage = filters.stage;
  }

  // Add role filter
  if (filters.role) {
    where.userRole = filters.role;
  }

  const totalCount = await db.userSignup.count({ where });
  const totalPages = Math.ceil(totalCount / limit);

  const subscribers = await db.userSignup.findMany({
    where,
    include: {
      user: {
        select: {
          email: true,
          status: true,
          profile: true,
          role: true,
        },
      },
      academy: {
        select: {
          name: true,
          domain: true,
        },
      },
    },
    orderBy: {
      [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc',
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data: subscribers,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

const regenerateOTP = async (id) => {
  const signup = await db.userSignup.findUnique({
    where: { id },
  });

  if (!signup) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Signup not found');
  }

  const otp = generateOTP(6);
  const otpExpiryTime = new Date();
  otpExpiryTime.setHours(otpExpiryTime.getHours() + 72);

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

  await sendVerificationEmail(signup, otp);

  return true;
};

const addSubscriptionPurchaseHandler = async (userId, subscriptionData) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      assignedToAcademy: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.assignedToAcademy || !user.assignedToAcademy.isDefault) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only portal subscribers can purchase subscriptions'
    );
  }

  const subscription = await db.studentSubscription.create({
    data: {
      userId,
      academyPlanId: subscriptionData.planId,
      autoRenew: subscriptionData.autoRenew || false,
      startDate: new Date(),
      endDate: subscriptionData.endDate
        ? new Date(subscriptionData.endDate)
        : null,
      status: 'ACTIVE',
      paymentStatus: 'PENDING',
    },
    include: {
      academyPlan: true,
    },
  });

  return subscription;
};

const createCheckoutSessionHandler = async (planId, userEmail) => {
  const signup = await db.userSignup.findUnique({
    where: { email: userEmail },
  });

  if (!signup) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const plan = await db.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: signup.email,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: plan.subscriberPrice * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      signupId: signup.id,
      planId,
      type: 'PORTAL_SUBSCRIPTION',
    },
    mode: 'payment',
    success_url: `${config.frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl}/subscription/cancel`,
  });

  return {
    sessionId: session.id,
    sessionUrl: session.url,
  };
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  return subscriptions;
};

const portalSubscriberService = {
  createPortalSignupHandler,
  verifyPortalSignupEmail,
  completePortalSignup,
  checkEmailAvailability,
  checkCicIdAvailability,
  checkChessComIdAvailability,
  updatePortalSignupHandler,
  fetchPortalSignupByIdHandler,
  listAllPortalSubscribersForAdmin,
  regenerateOTP,
  addSubscriptionPurchaseHandler,
  createCheckoutSessionHandler,
  getActiveSubscriptionsHandler,
};

module.exports = portalSubscriberService;
