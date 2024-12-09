const httpStatus = require('http-status');
const config = require('../config');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const createToken = require('../utils/createToken');
const decodeToken = require('../utils/decodeToken');
const sendMail = require('../utils/sendEmail');
const Mailgen = require('mailgen');
const logger = require('../utils/logger');
const formatNumberWithPrefix = require('../utils/formatNumberWithPrefix');
const hashPassword = require('../utils/hashPassword');
const crypto = require('crypto');
const generateDomain = require('../utils/generateDomain');
const stripe = require('../config/stripe');
const { uploadToCloudinary } = require('../utils/cloudinary.utils');

const inviteAcademyAdminHandler = async (data, loggedInUser) => {
  const { firstName, lastName, email, academyName, logo, contactNumber } = data;

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  let logoUrl = null;

  if (logo) {
    const uploadResult = await uploadToCloudinary(logo, {
      folder: 'academy-logos',
      publicId: `academy-${Date.now()}`,
      allowedFormats: ['jpg', 'jpeg', 'png'],
    });
    logoUrl = uploadResult.url;
  }

  if (existingUser) {
    if (logoUrl) {
      await deleteFromCloudinary(logoUrl);
    }
    throw new ApiError(
      httpStatus.CONFLICT,
      'A user with this email already exists.'
    );
  }

  const tempPassword = crypto.randomBytes(8).toString('hex');

  const academySignup = await db.academySignup.create({
    data: {
      academyName,
      contactName: `${firstName} ${lastName}`,
      email,
      phoneNumber: contactNumber || '',
      logoUrl: logo,
      status: 'INQUIRY',
    },
  });

  const academyAdminInvitation = await db.invitation.create({
    data: {
      data: {
        firstName,
        lastName,
        academyName,
        email,
        password: tempPassword,
        signupId: academySignup.id,
        contactNumber,
      },
      email,
      type: 'CREATE_ACADEMY',
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      createdBy: {
        connect: { id: loggedInUser.id },
      },
      academySignup: {
        connect: { id: academySignup.id },
      },
      version: 0,
    },
    include: {
      academySignup: true,
    },
  });

  const token = await createToken(
    {
      id: academyAdminInvitation.id,
      version: academyAdminInvitation.version,
      signupId: academySignup.id,
    },
    config.jwt.invitationSecret,
    '3d'
  );

  logger.info(token);

  const ACTIVATION_URL = `${
    config.frontendUrl
  }/accept-invite?type=CREATE_ACADEMY&name=${encodeURIComponent(
    academyName
  )}&token=${token}&signup=${academySignup.id}`;

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
      intro: [
        'You are invited to join Chess in Chunks as an Academy Admin!',
        'Here are the next steps to set up your academy:',
      ],
      table: {
        data: [
          {
            item: 'Step 1',
            description:
              'Click the "Accept Invitation" button below to start the setup process',
          },
          {
            item: 'Step 2',
            description: 'Choose your academy plan (Bronze, Silver, or Gold)',
          },
          {
            item: 'Step 3',
            description:
              'Select your academy domain (yourname.chessinchunks.com)',
          },
          {
            item: 'Step 4',
            description: 'Complete the payment process',
          },
        ],
      },
      action: {
        instructions:
          'To begin setting up your academy, please click the button below:',
        button: {
          color: '#22BC66',
          text: 'Accept Invitation',
          link: ACTIVATION_URL,
        },
      },
      outro: [
        "After accepting the invitation, you'll be guided through the plan selection and domain setup process.",
        'Your academy will be activated once all steps are completed.',
        'If you have any questions, feel free to reply to this email.',
      ],
    },
  };

  const emailBody = mailGenerator.generate(emailContent);
  const emailText = mailGenerator.generatePlaintext(emailContent);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to Chess in Chunks - Academy Admin Invitation',
    html: emailBody,
    text: emailText,
  };

  await sendMail(
    email,
    mailOptions.subject,
    mailOptions.text,
    mailOptions.html
  );

  return academyAdminInvitation;
};

const verifyAcademyAdminHandler = async (token, domain) => {
  if (!token) {
    throw new ApiError('Token not present!', httpStatus.BAD_REQUEST);
  }

  const data = await decodeToken(token, config.jwt.invitationSecret);

  const academyAdminInvitation = await db.invitation.findUnique({
    where: {
      id: data.id,
    },
  });

  if (academyAdminInvitation.version !== data.version) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Expired token');
  }

  if (academyAdminInvitation.type !== 'CREATE_ACADEMY') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token');
  }

  if (academyAdminInvitation.status === 'ACCEPTED') {
    throw new ApiError(
      httpStatus.ALREADY_REPORTED,
      'Invitation already accepted!'
    );
  }

  const {
    firstName,
    lastName,
    email,
    academyName,
    password,
    signupId,
    contactNumber,
  } = academyAdminInvitation.data;

  const academyAdminProfile = await db.profile.create({
    data: {
      firstName,
      lastName,
      phoneNumber: contactNumber,
    },
    select: {
      id: true,
    },
  });

  const userCount = await db.user.count();
  const newCode = formatNumberWithPrefix('U', userCount);

  const hashedPassword = await hashPassword(password, 10);

  const isEmailAlreadyExists = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (isEmailAlreadyExists) {
    throw new ApiError(httpStatus.CONFLICT, 'Email is already taken.');
  }

  const adminRole = await db.role.findUnique({
    where: { name: 'ADMIN' },
  });

  const academyAdmin = await db.user.create({
    data: {
      email,
      profile: {
        connect: {
          id: academyAdminProfile.id,
        },
      },
      code: newCode,
      role: {
        connect: {
          id: adminRole.id,
        },
      },
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
    },
  });

  const academySignup = await db.academySignup.findUnique({
    where: { id: signupId },
  });

  const newAcademy = await db.academy.create({
    data: {
      name: academyName,
      domain: `http://${domain}.localhost:3001`,
      logo: academySignup.logoUrl,
      admins: {
        connect: [{ id: academyAdmin.id }],
      },
      signup: {
        connect: { id: signupId },
      },
      status: 'ACTIVE',
    },
  });

  await db.academySignup.update({
    where: { id: signupId },
    data: {
      status: 'ACTIVE',
      finalDomain: domain,
    },
  });

  await db.user.update({
    where: {
      id: academyAdmin.id,
    },
    data: {
      adminOfAcademies: {
        connect: [{ id: newAcademy.id }],
      },
    },
  });

  await db.invitation.delete({
    where: {
      id: academyAdminInvitation.id,
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
      name: `${firstName} ${lastName}`,
      intro: [
        `Congratulations! Your academy "${academyName}" has been successfully created.`,
        'Here are your academy details:',
      ],
      table: {
        data: [
          {
            item: 'Academy Domain',
            description: `${newAcademy.domain}`,
          },
          {
            item: 'Admin Email',
            description: email,
          },
          {
            item: 'Admin Password',
            description: password,
          },
        ],
      },
      action: {
        instructions:
          'Click the button below to access your academy dashboard:',
        button: {
          color: '#22BC66',
          text: 'Access Dashboard',
          link: `${newAcademy.domain}/dashboard`,
        },
      },
      outro: [
        'For security reasons, please change your password after your first login.',
        'If you need any assistance, our support team is here to help!',
      ],
    },
  };

  const emailBody = mailGenerator.generate(emailContent);
  const emailText = mailGenerator.generatePlaintext(emailContent);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Welcome to Your New Academy - ${academyName}`,
    html: emailBody,
    text: emailText,
  };

  try {
    await sendMail(
      email,
      mailOptions.subject,
      mailOptions.text,
      mailOptions.html
    );
  } catch (error) {
    logger.error('Failed to send welcome email:', error);
  }

  return {
    newAcademy,
    academyAdmin,
  };
};

const fetchAllAdminsByAcademyId = async (page, limit, academyId) => {
  const allAdmins = await db.user.findMany({
    where: {
      adminOfAcademies: {
        some: {
          id: academyId,
        },
      },
    },
    include: {
      profile: true,
    },
  });

  return allAdmins;
};

const fetchAllAcademiesHandler = async (page, limit, query, loggedInUser) => {
  const numberPage = Number(page);
  const numberLimit = Number(limit);

  const user = await db.user.findUnique({
    where: { id: loggedInUser.id },
    include: { adminOfAcademies: true, role: true },
  });

  let allAcademies = [];

  if (user.role.name === 'SUPER_ADMIN') {
    allAcademies = await db.academy.findMany({
      skip: (numberPage - 1) * numberLimit,
      take: numberLimit,
      where: {
        name: { contains: query },
      },
      select: {
        id: true,
        name: true,
        domain: true,
        _count: {
          select: { batches: true, admins: true },
        },
        batches: {
          select: {
            _count: {
              select: { coaches: true, students: true },
            },
          },
        },
        createdAt: true,
        status: true,
        admins: {
          take: 1,
          select: {
            email: true,
          },
        },
      },
    });
  } else if (user.role.name === 'ADMIN') {
    const academyIDs = user.adminOfAcademies.map((el) => el.id);

    allAcademies = await db.academy.findMany({
      skip: (numberPage - 1) * numberLimit,
      take: numberLimit,
      where: {
        id: { in: academyIDs },
        name: { contains: query },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: { batches: true, admins: true },
        },
        batches: {
          select: {
            _count: {
              select: { students: true, coaches: true },
            },
          },
        },
        createdAt: true,
        status: true,
      },
    });
  }

  const academiesWithStudentCount = allAcademies.map((academy) => {
    const studentCount = academy.batches.reduce(
      (acc, batch) => acc + batch._count.students,
      0
    );

    console.log('studentCount', academy.batches);

    const coachesCount = academy.batches.reduce(
      (acc, batch) => acc + batch._count.coaches,
      0
    );

    return {
      ...academy,
      _count: {
        ...academy._count,
        students: studentCount || 0,
        coaches: coachesCount || 0,
      },
    };
  });

  return academiesWithStudentCount;
};

const fetchAllUsersHandler = async (
  page = 1,
  limit = 10,
  query = '',
  loggedInUser
) => {
  const numberPage = Math.max(1, Number(page));
  const numberLimit = Math.max(1, Number(limit));
  const searchQuery = query || '';

  const user = await db.user.findUnique({
    where: {
      id: loggedInUser.id,
    },
    include: {
      adminOfAcademies: true,
      role: true,
    },
  });

  if (!user) {
    return { allUsers: [] };
  }

  let allUsers = [];

  const searchFilters = [
    query ? { email: { contains: searchQuery } } : null,
    query ? { profile: { firstName: { contains: searchQuery } } } : null,
    query ? { profile: { lastName: { contains: searchQuery } } } : null,
  ].filter(Boolean);

  if (user.role.name === 'SUPER_ADMIN') {
    allUsers = await db.user.findMany({
      skip: (numberPage - 1) * numberLimit,
      take: numberLimit,
      where: {
        OR: searchFilters,
      },
      select: {
        email: true,
        role: true,
        subRole: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  } else if (user.role === 'ADMIN') {
    const academyIDs = user.adminOfAcademies.map((el) => el.id);

    allUsers = await db.user.findMany({
      skip: (numberPage - 1) * numberLimit,
      take: numberLimit,
      where: {
        OR: [
          {
            adminOfAcademies: {
              some: {
                id: {
                  in: academyIDs,
                },
              },
            },
          },
          {
            studentOfBatches: {
              some: {
                academyId: {
                  in: academyIDs,
                },
              },
            },
          },
          {
            coachOfBatches: {
              some: {
                academyId: {
                  in: academyIDs,
                },
              },
            },
          },
        ],
        AND: searchFilters,
      },
      select: {
        id: true,
        email: true,
        role: true,
        subRole: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  return {
    allUsers,
  };
};
const generatePlanCode = async () => {
  const systemCode = await db.systemCode.findFirst({
    where: {
      module: 'PLAN',
      isActive: true,
    },
  });

  if (!systemCode) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Plan system code configuration not found'
    );
  }

  const newNumber = systemCode.lastNumber + 1;

  await db.systemCode.update({
    where: { id: systemCode.id },
    data: { lastNumber: newNumber },
  });

  return formatNumberWithPrefix(systemCode.prefix, newNumber);
};

const createPlanHandler = async (planData) => {
  const { name, maxUsers, academyPrice, subscriberPrice, features } = planData;

  const planCode = await generatePlanCode();

  const product = await stripe.products.create({
    name: name,
    description: `Plan ID: ${planCode}. This plan allows ${maxUsers} users.`,
  });

  const academyStripePrice = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(academyPrice * 100),
    currency: 'usd',
    nickname: 'Academy Price',
  });

  const subscriberStripePrice = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(subscriberPrice * 100),
    currency: 'usd',
    nickname: 'Subscriber Price',
  });

  const plan = await db.plan.create({
    data: {
      planId: planCode,
      name,
      maxUsers,
      academyPrice,
      subscriberPrice,
      features,
      isFeatured: planData.isFeatured || false,
      academyStripePlanId: academyStripePrice.id,
      subscriberStripePlanId: subscriberStripePrice.id,
    },
  });

  return plan;
};

const checkDomainAvailabilityHandler = async (domain) => {
  const formattedDomain = generateDomain(domain);

  const existingDomain = await db.academy.findUnique({
    where: { domain: formattedDomain },
  });

  return {
    domain: formattedDomain,
    available: !existingDomain,
  };
};

const selectAcademyPlanHandler = async (signupId, planId, requestedDomain) => {
  const signup = await db.academySignup.findUnique({
    where: { id: signupId },
    include: { selectedPlan: true },
  });

  if (!signup) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Signup not found');
  }

  const domainCheck = await checkDomainAvailabilityHandler(requestedDomain);
  if (!domainCheck.available) {
    throw new ApiError(httpStatus.CONFLICT, 'Domain is not available');
  }

  const updatedSignup = await db.academySignup.update({
    where: { id: signupId },
    data: {
      selectedPlanId: planId,
      requestedDomain: domainCheck.domain,
      status: 'DOMAIN_SELECTION',
    },
    include: {
      selectedPlan: true,
    },
  });

  return updatedSignup;
};

const fetchAllPlansHandler = async (filters = {}, page = 1, limit = 10) => {
  try {
    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    const where = {
      AND: [
        search
          ? {
              OR: [{ name: { contains: search, mode: 'insensitive' } }],
            }
          : {},
      ],
    };

    const totalCount = await db.plan.count({ where });

    const skip = (page - 1) * limit;

    const plans = await db.plan.findMany({
      where,
      take: limit,
      skip,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: {
        id: true,
        name: true,
        maxUsers: true,
        academyPrice: true,
        subscriberPrice: true,
        features: true,
        isFeatured: true,
        planId: true,
        academyStripePlanId: true,
        subscriberStripePlanId: true,
        discountAllowed: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            academies: true,
            subscriptions: true,
            purchasedPlans: true,
            academySignups: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      plans,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage,
        hasPreviousPage,
      },
      summary: {
        totalPlans: totalCount,
        activePlans: plans.length,
      },
    };
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Error fetching plans: ' + error.message
    );
  }
};

const updatePlanHandler = async (planId, planData) => {
  const existingPlan = await db.plan.findUnique({
    where: { id: planId },
  });

  if (!existingPlan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  if (planData.academyPrice !== existingPlan.academyPrice) {
    const newAcademyPrice = await stripe.prices.create({
      product: existingPlan.stripePlanId,
      unit_amount: Math.round(planData.academyPrice * 100),
      currency: 'usd',
      nickname: 'Academy Price',
    });
    planData.academyStripePlanId = newAcademyPrice.id;
  }

  if (planData.subscriberPrice !== existingPlan.subscriberPrice) {
    const newSubscriberPrice = await stripe.prices.create({
      product: existingPlan.stripePlanId,
      unit_amount: Math.round(planData.subscriberPrice * 100),
      currency: 'usd',
      nickname: 'Subscriber Price',
    });
    planData.subscriberStripePlanId = newSubscriberPrice.id;
  }

  const updatedPlan = await db.plan.update({
    where: { id: planId },
    data: planData,
  });

  return updatedPlan;
};

const createCheckoutSessionHandler = async (
  signupId,
  planId,
  domain,
  token
) => {
  const plan = await db.plan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      name: true,
      academyPrice: true,
      academyStripePlanId: true,
    },
  });

  if (!plan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  if (!plan.academyStripePlanId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'This plan is not configured for academy purchases'
    );
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price: plan.academyStripePlanId,
        quantity: 1,
      },
    ],
    success_url: `${
      config.frontendUrl
    }/accept-invite?success=true&type=CREATE_ACADEMY&name=${encodeURIComponent(
      plan.name
    )}&token=${token}&signup=${signupId}&domain=${domain}`,
    cancel_url: `${config.frontendUrl}/accept-invite?canceled=true&type=CREATE_ACADEMY&token=${token}&signup=${signupId}&domain=${domain}`,
    metadata: {
      token,
      signupId,
      planId,
      domain,
      amount: plan.academyPrice,
      type: 'ACADEMY_PLAN',
    },
  });

  return session;
};

const superAdminService = {
  inviteAcademyAdminHandler,
  verifyAcademyAdminHandler,
  fetchAllAdminsByAcademyId,
  fetchAllAcademiesHandler,
  fetchAllUsersHandler,
  createPlanHandler,
  selectAcademyPlanHandler,
  fetchAllPlansHandler,
  checkDomainAvailabilityHandler,
  updatePlanHandler,
  createCheckoutSessionHandler,
};

module.exports = superAdminService;
