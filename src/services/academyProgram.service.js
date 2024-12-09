const stripe = require('../config/stripe');
const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const {
  PROGRAM_TYPE,
  PROGRAM_DURATION,
  SYSTEM_CODE_MODULE,
} = require('@prisma/client');
const { getSingleAcademyForUser } = require('./academy.service');
const generateSystemCode = require('../utils/generateSystemCode');

const createSearchConditions = (searchText) => {
  if (!searchText) return {};

  return {
    OR: [
      {
        name: {
          contains: searchText,
        },
      },
      {
        description: {
          contains: searchText,
        },
      },
    ],
  };
};

const getSortField = (sortBy) => {
  const validSortFields = [
    'name',
    'price',
    'type',
    'duration',
    'startDate',
    'endDate',
    'createdAt',
    'updatedAt',
  ];

  return validSortFields.includes(sortBy) ? sortBy : 'createdAt';
};

/**
 * Get all academy programs with pagination, search and sorting
 */
const listAllPrograms = async (
  academyId,
  {
    search = '',
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    type,
    duration,
    isActive = true,
    startDateFrom,
    startDateTo,
    priceFrom,
    priceTo,
  } = {}
) => {
  const searchCondition = createSearchConditions(search);
  const skip = (page - 1) * limit;

  const whereConditions = {
    academyId,
    isActive,
    ...searchCondition,
    ...(type && { type }),
    ...(duration && { duration }),
    ...(startDateFrom || startDateTo
      ? {
          startDate: {
            ...(startDateFrom && { gte: new Date(startDateFrom) }),
            ...(startDateTo && { lte: new Date(startDateTo) }),
          },
        }
      : {}),
    ...(priceFrom || priceTo
      ? {
          price: {
            ...(priceFrom && { gte: parseFloat(priceFrom) }),
            ...(priceTo && { lte: parseFloat(priceTo) }),
          },
        }
      : {}),
  };

  const total = await db.academyProgram.count({
    where: whereConditions,
  });

  const programs = await db.academyProgram.findMany({
    where: whereConditions,
    orderBy: {
      [getSortField(sortBy)]: sortOrder.toLowerCase(),
    },
    skip,
    take: parseInt(limit),
    include: {
      studentSubscriptions: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
      cartItems: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  return {
    results: programs,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
    totalResults: total,
  };
};

/**
 * Get program by ID with full details
 */
const getProgramById = async (programId, academyId) => {
  const program = await db.academyProgram.findFirst({
    where: {
      id: programId,
      academyId,
      isActive: true,
    },
    include: {
      studentSubscriptions: {
        select: {
          id: true,
          status: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      cartItems: {
        select: {
          id: true,
          status: true,
        },
      },
      studentProgramCredits: {
        select: {
          id: true,
          creditAmount: true,
          expiryDate: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!program) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
  }

  return program;
};

/**
 * Create Stripe product and price for academy program
 */

const createStripeProduct = async (programData) => {
  const product = await stripe.products.create({
    name: programData.name,
    description: `${programData.description || ''} - ${
      programData.type
    } Program`,
    metadata: {
      type: programData.type,
      duration: programData.duration,
      programId: programData.id,
    },
  });

  console.log('----PROGRAM-DATA----', programData);

  console.log('asda', {
    product: product.id,
    currency: 'usd',
    unit_amount: Math.round(programData.price * 100),
    interval:
      programData.duration === PROGRAM_DURATION.MONTHLY ? 'month' : undefined,
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: Math.round(programData.price * 100),
  });

  return price.id;
};

/**
 * Create a new academy program with signup fee handling
 */

const createProgramHandler = async (data, academyId, loggedInUser) => {
  if (
    !data.name ||
    !data.type ||
    !data.duration ||
    !data.price ||
    !data.startDate ||
    !data.endDate
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
  }

  const programId = await generateSystemCode(
    SYSTEM_CODE_MODULE.ACADEMY_PROGRAM
  );

  const program = await db.academyProgram.create({
    data: {
      academy: {
        connect: {
          id: academyId,
        },
      },
      isActive: true,
      creditPoints: data.creditPoints || 0,
      isSignUpFee: data.isSignUpFee || false,
      name: data.name,
      type: data.type,
      duration: data.duration,
      price: data.price,
      condition: data.condition,
      description: data.description || null,
      discountRules: data.discountRules || null,
      discountAmount: data.discountAmount || null,
      latePaymentFees: data.latePaymentFees || null,
      dueDate: data.dueDate || null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      programId,
    },
  });

  const stripeProgramId = await createStripeProduct({
    ...program,
    id: program.id,
  });

  const updatedProgram = await db.academyProgram.update({
    where: { id: program.id },
    data: { stripeProgramId },
  });

  return updatedProgram;
};

const updateAcademyProgramById = async (programId, academyId, updateData) => {
  const program = await db.academyProgram.findFirst({
    where: {
      id: programId,
      academyId,
      isActive: true,
    },
    include: {
      studentSubscriptions: {
        where: {
          status: {
            in: ['ACTIVE', 'PENDING'],
          },
        },
        select: {
          id: true,
          status: true,
          student: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!program) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
  }

  if (program.studentSubscriptions.length > 0) {
    const criticalFields = ['type', 'duration'];
    const hasChangesToCriticalFields = criticalFields.some(
      (field) => updateData[field] && updateData[field] !== program[field]
    );

    if (hasChangesToCriticalFields) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Cannot modify program type or duration while students are enrolled'
      );
    }

    if (updateData.price && updateData.price > program.price) {
      await Promise.all(
        program.studentSubscriptions.map(async (subscription) => {
          await db.notification.create({
            data: {
              type: 'PROGRAM_PRICE_CHANGE',
              userId: subscription.student.id,
              title: 'Program Price Change',
              message: `The price for program ${program.name} will change from $${program.price} to $${updateData.price}`,
              metadata: {
                programId: program.id,
                oldPrice: program.price,
                newPrice: updateData.price,
                effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              },
            },
          });
        })
      );
    }
  }

  if (updateData.price || updateData.name) {
    const stripeProduct = await stripe.products.retrieve(
      program.stripeProgramId
    );

    await stripe.products.update(stripeProduct.id, {
      name: updateData.name || program.name,
      metadata: {
        ...stripeProduct.metadata,
        type: updateData.type || program.type,
        duration: updateData.duration || program.duration,
      },
    });

    if (updateData.price) {
      const newPrice = await stripe.prices.create({
        product: stripeProduct.id,
        currency: 'usd',
        unit_amount: Math.round(updateData.price * 100),
        interval:
          (updateData.duration || program.duration) === PROGRAM_DURATION.MONTHLY
            ? 'month'
            : undefined,
        interval_count:
          (updateData.duration || program.duration) ===
          PROGRAM_DURATION.SEASONAL
            ? 4
            : 1,
      });

      updateData.stripePriceId = newPrice.id;
    }
  }

  if (updateData.startDate) {
    updateData.startDate = new Date(updateData.startDate);
  }
  if (updateData.endDate) {
    updateData.endDate = new Date(updateData.endDate);
  }
  if (updateData.dueDate) {
    updateData.dueDate = new Date(updateData.dueDate);
  }

  const updatedProgram = await db.academyProgram.update({
    where: { id: programId },
    data: {
      ...updateData,
      updatedAt: new Date(),
    },
    include: {
      studentSubscriptions: {
        select: {
          id: true,
          status: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return updatedProgram;
};

/**
 * Delete program by ID with student enrollment handling
 */
const deleteProgramById = async (programId, academyId) => {
  const program = await db.academyProgram.findFirst({
    where: {
      id: programId,
      academyId,
      isActive: true,
    },
    include: {
      studentSubscriptions: {
        where: {
          status: {
            in: ['ACTIVE', 'PENDING'],
          },
        },
        select: {
          id: true,
          status: true,
          student: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      cartItems: {
        where: {
          status: 'PENDING',
        },
      },
    },
  });

  if (!program) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
  }

  if (program.studentSubscriptions.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot delete program with active students. Please transfer or graduate all students first.'
    );
  }

  if (program.cartItems.length > 0) {
    await db.cartItem.updateMany({
      where: {
        programId,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
        statusReason: 'Program discontinued',
      },
    });
  }

  if (program.stripeProgramId) {
    await stripe.products.update(program.stripeProgramId, {
      active: false,
    });
  }

  const deletedProgram = await db.academyProgram.update({
    where: { id: programId },
    data: {
      isActive: false,
    },
  });

  return deletedProgram;
};

/**
 * Get program options for dropdowns and selectors
 */
const getProgramOptions = async (academyId) => {
  const allPrograms = await db.academyProgram.findMany({
    where: {
      academyId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      type: true,
      duration: true,
      price: true,
      startDate: true,
      endDate: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return allPrograms;
};

const getProgramSubscribers = async (programId, academyId) => {
  const program = await db.academyProgram.findFirst({
    where: {
      id: programId,
      academyId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      type: true,
      studentSubscriptions: {
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          autoRenew: true,
          startDate: true,
          endDate: true,
          lastBillingDate: true,
          nextBillingDate: true,
          stripeSubscriptionId: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!program) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
  }

  return program.studentSubscriptions;
};

const getAcademyPrograms = async (academyId) => {
  if (!academyId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Academy ID is required');
  }

  const allPrograms = await db.academyProgram.findMany({
    where: {
      academyId: academyId,
      isActive: true,
    },
    include: {
      studentSubscriptions: {
        select: {
          id: true,
          status: true,
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
      cartItems: {
        select: {
          id: true,
          status: true,
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return allPrograms;
};

const academyProgramService = {
  createProgramHandler,
  listAllPrograms,
  getProgramById,
  updateAcademyProgramById,
  deleteProgramById,
  getProgramOptions,
  getProgramSubscribers,
  getAcademyPrograms,
};

module.exports = academyProgramService;
