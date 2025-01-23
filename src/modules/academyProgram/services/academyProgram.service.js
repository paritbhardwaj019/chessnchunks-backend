const { SYSTEM_CODE_MODULE } = require('@prisma/client');
const httpStatus = require('http-status');
const { stripe } = require('../../../config');
const db = require('../../../database/prisma');
const ApiError = require('../../../utils/apiError');
const generateSystemCode = require('../../../utils/generateSystemCode');

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
      programId: programData.id,
      seasonPrice: programData.seasonPrice.toString(),
      monthlyPrice: programData.monthlyPrice.toString(),
      yearlyDiscountPercentage: programData.yearlyDiscountPercentage.toString(),
    },
  });

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: Math.round(programData.monthlyPrice * 100),
    recurring: {
      interval: 'month',
    },
    nickname: 'Monthly',
  });

  const seasonalPrice = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: Math.round(programData.seasonPrice * 100),
    recurring: {
      interval: 'month',
      interval_count: 4,
    },
    nickname: 'Seasonal',
  });

  const yearlyAmount = Math.round(
    programData.monthlyPrice *
      12 *
      (1 - programData.yearlyDiscountPercentage / 100) *
      100
  );
  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: yearlyAmount,
    recurring: {
      interval: 'year',
    },
    nickname: 'Yearly',
  });

  return {
    productId: product.id,
    monthlyPriceId: monthlyPrice.id,
    seasonalPriceId: seasonalPrice.id,
    yearlyPriceId: yearlyPrice.id,
  };
};
/**
 * Create a new academy program with signup fee handling
 */

const createProgramHandler = async (data, academyId) => {
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
      seasonPrice: data.seasonPrice,
      monthlyPrice: data.monthlyPrice,
      yearlyDiscountPercentage: data.yearlyDiscountPercentage,
      description: data.description || null,
      discountRules: data.discountRules || null,
      discountAmount: data.discountAmount || null,
      latePaymentFees: data.latePaymentFees || null,
      dueDate: data.dueDate || null,
      programId,
    },
  });

  const { productId, monthlyPriceId, seasonalPriceId, yearlyPriceId } =
    await createStripeProduct({
      ...program,
      id: program.id,
    });

  const updatedProgram = await db.academyProgram.update({
    where: { id: program.id },
    data: {
      stripeProgramId: productId,
      stripeMonthlyPriceId: monthlyPriceId,
      stripeSeasonalPriceId: seasonalPriceId,
      stripeYearlyPriceId: yearlyPriceId,
    },
  });

  return updatedProgram;
};

const updateAcademyProgramById = async (programId, academyId, updateData) => {
  const program = await db.academyProgram.findFirst({
    where: {
      id: programId,
      isActive: true,
    },
    include: {
      studentSubscriptions: true,
    },
  });

  if (!program) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
  }

  if (
    program.studentSubscriptions.length > 0 &&
    updateData.type !== program.type
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot modify program type while students are enrolled'
    );
  }

  if (
    updateData.seasonPrice ||
    updateData.monthlyPrice ||
    updateData.yearlyDiscountPercentage ||
    updateData.name
  ) {
    const stripeProduct = await stripe.products.retrieve(
      program.stripeProgramId
    );

    await stripe.products.update(stripeProduct.id, {
      name: updateData.name || program.name,
      metadata: {
        ...stripeProduct.metadata,
        type: updateData.type || program.type,
        seasonPrice:
          updateData.seasonPrice?.toString() || program.seasonPrice.toString(),
        monthlyPrice:
          updateData.monthlyPrice?.toString() ||
          program.monthlyPrice.toString(),
        yearlyDiscountPercentage:
          updateData.yearlyDiscountPercentage?.toString() ||
          program.yearlyDiscountPercentage.toString(),
      },
    });

    const stripeUpdates = {};

    if (updateData.monthlyPrice) {
      const monthlyPrice = await stripe.prices.create({
        product: stripeProduct.id,
        currency: 'usd',
        unit_amount: Math.round(updateData.monthlyPrice * 100),
        recurring: {
          interval: 'month',
        },
        nickname: 'Monthly',
      });
      stripeUpdates.stripeMonthlyPriceId = monthlyPrice.id;
    }

    if (updateData.seasonPrice) {
      const seasonalPrice = await stripe.prices.create({
        product: stripeProduct.id,
        currency: 'usd',
        unit_amount: Math.round(updateData.seasonPrice * 100),
        recurring: {
          interval: 'month',
          interval_count: 4,
        },
        nickname: 'Seasonal',
      });
      stripeUpdates.stripeSeasonalPriceId = seasonalPrice.id;
    }

    if (updateData.monthlyPrice || updateData.yearlyDiscountPercentage) {
      const yearlyAmount = Math.round(
        (updateData.monthlyPrice || program.monthlyPrice) *
          12 *
          (1 -
            (updateData.yearlyDiscountPercentage ||
              program.yearlyDiscountPercentage) /
              100) *
          100
      );
      const yearlyPrice = await stripe.prices.create({
        product: stripeProduct.id,
        currency: 'usd',
        unit_amount: yearlyAmount,
        recurring: {
          interval: 'year',
        },
        nickname: 'Yearly',
      });
      stripeUpdates.stripeYearlyPriceId = yearlyPrice.id;
    }

    Object.assign(updateData, stripeUpdates);
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
      studentSubscriptions: true,
    },
  });

  return updatedProgram;
};

const deleteProgramById = async (programId) => {
  if (!programId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Program ID is required');
  }

  const program = await db.academyProgram.findFirst({
    where: {
      id: programId,
      isActive: true,
    },
    include: {
      studentSubscriptions: {
        where: {
          status: {
            in: ['ACTIVE'],
          },
        },
        select: {
          id: true,
          status: true,
          user: {
            select: {
              id: true,
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
      'Cannot delete program with active student subscriptions. Please resolve all subscriptions before deletion.'
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

const updateProgramCredits = async (programId, academyId, creditData) => {
  const program = await db.academyProgram.findFirst({
    where: {
      id: programId,
      academyId,
      isActive: true,
    },
  });

  if (!program) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Program not found');
  }

  if (creditData.creditPoints < 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Credit points cannot be negative'
    );
  }

  if (creditData.latePaymentFees < 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Late payment fees cannot be negative'
    );
  }

  if (creditData.discountAmount < 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Discount amount cannot be negative'
    );
  }

  if (creditData.dueDate && new Date(creditData.dueDate) < new Date()) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Due date cannot be in the past'
    );
  }

  const formattedCreditData = {
    creditPoints: parseInt(creditData.creditPoints, 10),
    condition: creditData.condition,
    discountRules: creditData.discountRules || {},
    discountAmount: parseFloat(creditData.discountAmount) || 0,
    latePaymentFees: parseFloat(creditData.latePaymentFees) || 0,
    dueDate: creditData.dueDate ? new Date(creditData.dueDate) : null,
  };

  const updatedProgram = await db.academyProgram.update({
    where: { id: programId },
    data: {
      ...formattedCreditData,
      updatedAt: new Date(),
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
                select: { firstName: true, lastName: true },
              },
            },
          },
          paymentStatus: true,
          autoRenew: true,
          lastBillingDate: true,
          nextBillingDate: true,
          userId: true,
          academyPlanId: true,
          stripeSubscriptionId: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
          academyPlan: true,
        },
      },
    },
  });

  return updatedProgram;
};

const getProgramCreditHistory = async (programId, academyId) => {
  const program = await db.academyProgram.findFirst({
    where: {
      id: programId,
      academyId,
      isActive: true,
    },
    include: {
      studentProgramCredits: {
        select: {
          id: true,
          creditAmount: true,
          expiryDate: true,
          createdAt: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
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

  return program.studentProgramCredits;
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
  updateProgramCredits,
  getProgramCreditHistory,
};

module.exports = academyProgramService;
