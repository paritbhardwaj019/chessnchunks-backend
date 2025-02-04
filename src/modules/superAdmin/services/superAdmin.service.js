const crypto = require('crypto');
const fs = require('fs');

const httpStatus = require('http-status');
const Mailgen = require('mailgen');
const { v4: uuidv4 } = require('uuid');
const config = require('../../../config');
const stripe = require('../../../config/stripe');
const { defaultNavigation } = require('../../../data/defaultNavigation');
const db = require('../../../database/prisma');
const ApiError = require('../../../utils/apiError');
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require('../../../utils/cloudinary.utils');
const createDefaultPagesForAcademy = require('../../../utils/createDefaultPages');
const createToken = require('../../../utils/createToken');
const decodeToken = require('../../../utils/decodeToken');
const formatNumberWithPrefix = require('../../../utils/formatNumberWithPrefix');
const hashPassword = require('../../../utils/hashPassword');
const generateDomain = require('../../../utils/generateDomain');
const logger = require('../../../utils/logger');
const sendMail = require('../../../utils/sendEmail');
const ROLE_CONSTANT = require('../../../constants');
const DOMAIN_CONFIG = require('../../../config/domains');
const _ = require('lodash');

/**
 * Handles academy admin invitation process
 * @async
 * @param {Object} data - Invitation data
 * @param {string} data.firstName - Admin's first name
 * @param {string} data.lastName - Admin's last name
 * @param {string} data.email - Admin's email
 * @param {string} data.academyName - Academy name
 * @param {string} data.contactNumber - Contact number
 * @param {number} data.discountPercentage - Discount percentage
 * @param {Object} loggedInUser - Currently logged in user
 * @param {Object} logoFile - Uploaded logo file
 * @returns {Promise<Object>} Created invitation
 * @throws {ApiError} If email exists or logo upload fails
 */
const inviteAcademyAdminHandler = async (data, loggedInUser, logoFile) => {
  const {
    firstName,
    lastName,
    email,
    academyName,
    contactNumber,
    discountPercentage,
  } = data;

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  let logoUrl = null;

  const newInvitationId = uuidv4();

  if (logoFile) {
    try {
      const uploadResult = await uploadToCloudinary(logoFile.path, {
        folder: 'academy-logos',
        publicId: `academy-${newInvitationId}-logo`,
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif'],
        maxSize: 5 * 1024 * 1024,
      });
      logoUrl = uploadResult.url;
    } catch (error) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Logo upload failed - ${error.message}`
      );
    } finally {
      fs.unlinkSync(logoFile.path);
    }
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
      logoUrl,
      status: 'INQUIRY',
      discountPercentage: parseFloat(discountPercentage),
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
            description: 'Choose your academy plan with available discounts',
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

/**
 * Creates navigation items for academy
 * @async
 * @param {Array} items - Navigation items to create
 * @param {string} academyId - Academy ID
 * @param {string|null} parentId - Parent navigation item ID
 * @returns {Promise<void>}
 */
const createNavigationItems = async (items, academyId, parentId = null) => {
  for (const item of items) {
    const navItem = await db.academyNavigation.create({
      data: {
        title: item.title,
        slug: item.slug,
        order: item.order,
        isActive: true,
        parentId,
        academyId,
      },
    });

    if (item.subItems && item.subItems.length > 0) {
      await createNavigationItems(item.subItems, academyId, navItem.id);
    }
  }
};

/**
 * Verifies academy admin and creates academy
 * @async
 * @param {string} token - Verification token
 * @param {string} domain - Academy domain
 * @param {string} stripeCustomerId - Stripe customer ID
 * @param {string} planId - Selected plan ID
 * @returns {Promise<Object>} Created academy and admin details
 * @throws {ApiError} If token invalid or verification fails
 */
const verifyAcademyAdminHandler = async (
  token,
  domain,
  stripeCustomerId,
  planId
) => {
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
  const newCode = formatNumberWithPrefix('U', userCount + 1);

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
    where: { name: ROLE_CONSTANT.ROLE.ADMIN },
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
      stripeCustomerId,
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
      plan: {
        connect: { id: planId },
      },
    },
  });

  await createNavigationItems(defaultNavigation, newAcademy.id);
  await createDefaultPagesForAcademy(newAcademy.id);

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
      outro: ['If you need any assistance, our support team is here to help!'],
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

/**
 * Fetches all admins for a specific academy
 * @async
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} academyId - Academy ID
 * @returns {Promise<Object>} Paginated list of admins
 * @throws {ApiError} If academy not found
 */
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

/**
 * Fetches all academies with filtering and pagination
 * @async
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} query - Search query
 * @param {Object} user - Logged in user
 * @returns {Promise<Object>} Paginated list of academies
 */
const fetchAllAcademiesHandler = async (page, limit, query, user) => {
  const numberPage = Number(page);
  const numberLimit = Number(limit);

  let allAcademies = [];

  if (user.role.name === ROLE_CONSTANT.ROLE.SUPER_ADMIN) {
    allAcademies = await db.academy.findMany({
      skip: (numberPage - 1) * numberLimit,
      take: numberLimit,
      where: {
        name: { contains: query },
        isDefault: false,
      },
      select: {
        id: true,
        name: true,
        domain: true,
        _count: {
          select: { batches: true, admins: true },
        },
        signup: {
          select: {
            discountPercentage: true,
          },
        },
        batches: {
          select: {
            _count: {
              select: { coaches: true, students: true },
            },
          },
        },
        createdAt: true,
        logo: true,
        status: true,
        admins: {
          take: 1,
          select: {
            email: true,
          },
        },
      },
    });
  } else if (user.role.name === ROLE_CONSTANT.ROLE.ADMIN) {
    const academyIDs = user.adminOfAcademies.map((el) => el.id);

    allAcademies = await db.academy.findMany({
      skip: (numberPage - 1) * numberLimit,
      take: numberLimit,
      where: {
        id: { in: academyIDs },
        name: { contains: query },
        isDefault: false,
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

/**
 * Fetches all users with pagination and filtering
 * @async
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=10] - Number of items per page
 * @param {string} [query=''] - Search query for filtering users
 * @param {Object} loggedInUser - Currently logged in user
 * @param {string} loggedInUser.id - User ID
 * @returns {Promise<Object>} Object containing array of users
 * @property {Array} allUsers - Array of user objects with their details
 * @property {string} allUsers[].email - User's email
 * @property {Object} allUsers[].role - User's role
 * @property {Object} allUsers[].subRole - User's sub role
 * @property {Object} allUsers[].profile - User's profile information
 * @property {string} allUsers[].profile.firstName - User's first name
 * @property {string} allUsers[].profile.lastName - User's last name
 * @throws {ApiError} If user not found
 */
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

  if (user.role.name === ROLE_CONSTANT.ROLE.SUPER_ADMIN) {
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
  } else if (user.role === ROLE_CONSTANT.ROLE.ADMIN) {
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

/**
 * Creates a new plan
 * @async
 * @param {Object} planData - Plan data
 * @param {string} planData.name - Plan name
 * @param {number} planData.maxUsers - Maximum users allowed
 * @param {number} planData.academyPrice - Academy price
 * @param {number} planData.subscriberPrice - Subscriber price
 * @param {Array} planData.features - Plan features
 * @param {boolean} planData.isFeatured - Whether plan is featured
 * @returns {Promise<Object>} Created plan
 * @throws {ApiError} If plan creation fails
 */
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

/**
 * Checks domain availability
 * @async
 * @param {string} domain - Domain to check
 * @returns {Promise<Object>} Domain availability status
 * @throws {ApiError} If domain check fails
 */
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

/**
 * Selects an academy plan
 * @async
 * @param {string} signupId - Signup ID
 * @param {string} planId - Plan ID
 * @param {string} domain - Academy domain
 * @returns {Promise<Object>} Selected plan details
 * @throws {ApiError} If plan selection fails
 */
const selectAcademyPlanHandler = async (signupId, planId, domain) => {
  const signup = await db.academySignup.findUnique({
    where: { id: signupId },
    include: { selectedPlan: true },
  });

  if (!signup) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Signup not found');
  }

  const domainCheck = await checkDomainAvailabilityHandler(domain);
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

/**
 * Fetches all plans with filtering
 * @async
 * @param {Object} filters - Filter parameters
 * @param {string} [filters.type] - Plan type
 * @param {string} [filters.search] - Search query
 * @param {string} [filters.signupId] - Signup ID for discount
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Paginated list of plans
 */
const fetchAllPlansHandler = async (filters, page, limit) => {
  try {
    const {
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      signupId,
    } = filters;

    let discountPercentage = 0;

    if (signupId) {
      const signup = await db.academySignup.findUnique({
        where: { id: signupId },
        select: { discountPercentage: true },
      });

      discountPercentage = signup?.discountPercentage || 0;
    }

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

    const plansWithDiscount = plans.map((plan) => {
      let discountedPrice = null;
      if (discountPercentage > 0) {
        discountedPrice = plan.academyPrice * (1 - discountPercentage / 100);
      }
      return {
        ...plan,
        discountedPrice: discountedPrice?.toFixed(2) || null,
        discountPercentage: discountPercentage,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      plans: plansWithDiscount,
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

/**
 * Updates an existing plan
 * @async
 * @param {string} planId - Plan ID to update
 * @param {Object} planData - Plan update data
 * @param {string} [planData.name] - Plan name
 * @param {number} [planData.maxUsers] - Maximum users allowed
 * @param {number} [planData.academyPrice] - Academy price
 * @param {number} [planData.subscriberPrice] - Subscriber price
 * @param {Array} [planData.features] - Plan features
 * @param {boolean} [planData.isFeatured] - Whether plan is featured
 * @returns {Promise<Object>} Updated plan
 * @throws {ApiError} If plan not found or update fails
 */
const updatePlanHandler = async (planId, planData) => {
  const existingPlan = await db.plan.findUnique({
    where: { id: planId },
    include: {
      academies: true,
    },
  });

  if (!existingPlan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  if (existingPlan.academies.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot update plan that has associated academies'
    );
  }

  const academyPrice = await stripe.prices.retrieve(
    existingPlan.academyStripePlanId
  );

  const productId = academyPrice.product;

  if (planData.academyPrice !== existingPlan.academyPrice) {
    const newAcademyPrice = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(planData.academyPrice * 100),
      currency: 'usd',
      nickname: 'Academy Price',
    });
    planData.academyStripePlanId = newAcademyPrice.id;
  }

  if (planData.subscriberPrice !== existingPlan.subscriberPrice) {
    const newSubscriberPrice = await stripe.prices.create({
      product: productId,
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

/**
 * Creates a checkout session
 * @async
 * @param {string} signupId - Signup ID
 * @param {string} planId - Plan ID
 * @param {string} domain - Academy domain
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Stripe checkout session
 * @throws {ApiError} If session creation fails
 */
const createCheckoutSessionHandler = async (
  signupId,
  planId,
  domain,
  token
) => {
  const [plan, signup] = await Promise.all([
    db.plan.findUnique({ where: { id: planId } }),
    db.academySignup.findUnique({ where: { id: signupId } }),
  ]);

  if (!plan || !signup)
    throw new ApiError(httpStatus.NOT_FOUND, 'Plan or signup not found');

  let discounts = [];

  if (signup.discountPercentage > 0) {
    let coupon;
    const coupons = await stripe.coupons.list({
      percent_off: signup.discountPercentage,
    });
    coupon =
      coupons.data[0] ||
      (await stripe.coupons.create({
        percent_off: signup.discountPercentage,
        duration: 'forever',
        name: `${signup.discountPercentage}% Academy Discount`,
      }));
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
    });
    discounts.push({ promotion_code: promotionCode.id });
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
    discounts,
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

/**
 * Deletes a plan
 * @async
 * @param {string} planId - Plan ID to delete
 * @returns {Promise<Object>} Deleted plan
 * @throws {ApiError} If plan not found or has associated academies
 */
const deletePlanHandler = async (planId) => {
  const plan = await db.plan.findUnique({
    where: { id: planId },
    include: {
      academies: true,
    },
  });

  if (!plan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  if (plan.academies.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot delete plan that has associated academies'
    );
  }

  if (plan.academyStripePlanId) {
    await stripe.prices.update(plan.academyStripePlanId, { active: false });
  }
  if (plan.subscriberStripePlanId) {
    await stripe.prices.update(plan.subscriberStripePlanId, { active: false });
  }

  const deletedPlan = await db.plan.delete({
    where: { id: planId },
  });

  return deletedPlan;
};

/**
 * Creates a super admin user
 * @async
 * @param {Object} data - User data
 * @param {string} data.firstName - First name
 * @param {string} data.lastName - Last name
 * @param {string} data.email - Email address
 * @param {string} data.password - Password
 * @param {string} data.dateOfBirth - Date of birth
 * @param {string} data.cicId - Chess in Chunks ID
 * @returns {Promise<Object>} Created super admin and default academy
 * @throws {ApiError} If user creation fails
 */
const createSuperAdminHandler = async (data) => {
  const { firstName, lastName, email, password, dateOfBirth, cicId } = data;

  try {
    const isEmailAlreadyExists = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (isEmailAlreadyExists) {
      throw new ApiError(httpStatus.CONFLICT, 'Email is already taken.');
    }

    const isCicIdExistsInProfile = await db.profile.findUnique({
      where: {
        cicId,
      },
    });

    if (isCicIdExistsInProfile) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Chess in Chunks ID is already taken.'
      );
    }

    const userCount = await db.user.count();
    const newCode = formatNumberWithPrefix('U', userCount);

    const hashedPassword = await hashPassword(password, 10);

    const superAdminProfile = await db.profile.create({
      data: {
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        cicId,
      },
      select: {
        id: true,
      },
    });

    const superAdminRole = await db.role.findUnique({
      where: { name: ROLE_CONSTANT.ROLE.SUPER_ADMIN },
    });

    if (!superAdminRole) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Super Admin role not found.');
    }

    const superAdmin = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        profile: {
          connect: {
            id: superAdminProfile.id,
          },
        },
        code: newCode,
        role: {
          connect: {
            id: superAdminRole.id,
          },
        },
        status: 'ACTIVE',
      },
    });

    const academyName = 'Chess in Chunks';
    const newAcademy = await db.academy.create({
      data: {
        name: academyName,
        domain: DOMAIN_CONFIG.getAcademyDomain(academyName),
        admins: {
          connect: [{ id: superAdmin.id }],
        },
        status: 'ACTIVE',
        isDefault: true,
      },
    });

    await createNavigationItems(defaultNavigation, newAcademy.id);

    await createDefaultPagesForAcademy(newAcademy.id);

    await db.user.update({
      where: { id: superAdmin.id },
      data: {
        adminOfAcademies: {
          connect: [{ id: newAcademy.id }],
        },
      },
    });

    if (!_.isEmpty(superAdmin)) {
      logger.info('Superadmin created successfully');
      logger.info('Default academy created successfully');
    }

    return {
      success: true,
      user: superAdmin,
      academy: newAcademy,
    };
  } catch (error) {
    logger.error('Error creating superadmin:', error);
    throw error;
  }
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
  deletePlanHandler,
  createNavigationItems,
  createSuperAdminHandler,
};

module.exports = superAdminService;
