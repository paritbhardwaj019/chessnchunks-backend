const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const formatNumberWithPrefix = require('../utils/formatNumberWithPrefix');

const createSeasonalGoalHandler = async (data) => {
  const { startDate, endDate, batchId } = data;

  const newStartDate = new Date(startDate);
  const newEndDate = new Date(endDate);

  const seasonalGoalCount = await db.seasonalGoal.count({
    where: {
      batch: {
        id: batchId,
      },
    },
  });

  const seasonalCode = formatNumberWithPrefix('SG', seasonalGoalCount);

  const createdSeasonalGoal = await db.seasonalGoal.create({
    data: {
      startDate: newStartDate,
      endDate: newEndDate,
      batch: {
        connect: {
          id: batchId,
        },
      },
      code: seasonalCode,
    },
  });

  return createdSeasonalGoal;
};

const createMonthlyGoalHandler = async (data) => {
  const { seasonalGoalId, startDate, endDate, batchId } = data;

  console.log('MONTHLY DATA', data);

  const newStartDate = new Date(startDate);
  const newEndDate = new Date(endDate);

  const monthlyGoalCount = await db.monthlyGoal.count({
    where: {
      seasonalGoal: {
        id: seasonalGoalId,
      },
    },
  });

  const monthlyGoalCode = formatNumberWithPrefix('MG', monthlyGoalCount);

  const createdMonthlyGoal = await db.monthlyGoal.create({
    data: {
      seasonalGoal: {
        connect: {
          id: seasonalGoalId,
        },
      },
      startDate: newStartDate,
      endDate: newEndDate,
      code: monthlyGoalCode,
      batch: {
        connect: {
          id: batchId,
        },
      },
    },
  });

  return createdMonthlyGoal;
};

const createWeeklyGoalHandler = async (data) => {
  const {
    monthlyGoalId,
    startDate,
    endDate,
    noOfGames,
    minReviews,
    midReviews,
    maxReviews,
    batchId,
  } = data;

  const newStartDate = new Date(startDate);
  const newEndDate = new Date(endDate);

  const weeklyGoalCount = await db.weeklyGoal.count({
    where: {
      monthlyGoal: {
        id: monthlyGoalId,
      },
    },
  });

  const weeklyGoalCode = formatNumberWithPrefix('WG', weeklyGoalCount);

  const createdWeeklyGoal = await db.weeklyGoal.create({
    data: {
      startDate: newStartDate,
      endDate: newEndDate,
      monthlyGoal: {
        connect: {
          id: monthlyGoalId,
        },
      },
      target: {
        create: {
          noOfGames: parseInt(noOfGames, 10),
          minReviews: parseInt(minReviews, 10),
          maxReviews: parseInt(midReviews, 10),
          midReviews: parseInt(maxReviews, 10),
        },
      },
      code: weeklyGoalCode,
      batch: {
        connect: {
          id: batchId,
        },
      },
    },
    select: {
      target: true,
    },
  });

  return createdWeeklyGoal;
};

const assignWeeklyGoalHandler = async (data) => {
  const { weeklyGoalId, batchId } = data;

  const foundBatch = await db.batch.findUnique({
    where: { id: batchId },
    select: { students: { select: { id: true } } },
  });

  if (!foundBatch || foundBatch.students.length < 1)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'No students found in the specified batch'
    );

  const allStudentsData = foundBatch.students.map((el) => ({
    studentId: el.id,
    weeklyGoalId,
  }));

  const allGoals = await db.studentWeeklyGoal.createMany({
    data: allStudentsData,
    skipDuplicates: true,
  });

  await Promise.all(
    foundBatch.students.map(async (el) => {
      const foundStudentWeeklyGoal = await db.studentWeeklyGoal.findFirst({
        where: {
          studentId: el.id,
          weeklyGoalId: weeklyGoalId,
        },
        select: { id: true },
      });

      await db.user.update({
        where: { id: el.id },
        data: {
          studentGoals: {
            connect: {
              id: foundStudentWeeklyGoal.id,
            },
          },
        },
      });
    })
  );

  return allGoals;
};

const getAllSeasonalGoalsHandler = async (page, limit, query, loggedInUser) => {
  const numberPage = Number(page) || 1;
  const numberLimit = Number(limit) || 10;
  const { batchId } = query;

  let batchFilter = {};

  if (loggedInUser.role === 'ADMIN') {
    batchFilter = {
      batch: {
        academy: {
          admins: {
            some: {
              id: loggedInUser.id,
            },
          },
        },
      },
    };
  } else if (loggedInUser.role === 'COACH') {
    batchFilter = {
      batch: {
        coaches: {
          some: {
            id: loggedInUser.id,
          },
        },
      },
    };
  } else if (loggedInUser.role === 'STUDENT') {
    batchFilter = {
      batch: {
        students: {
          some: {
            id: loggedInUser.id,
          },
        },
      },
    };
  }

  if (batchId) {
    batchFilter.batchId = batchId;
  }

  const seasonalGoals = await db.seasonalGoal.findMany({
    where: batchFilter,
    skip: (numberPage - 1) * numberLimit,
    take: numberLimit,
    include: {
      _count: {
        select: { monthlyGoals: true },
      },
    },
  });

  return seasonalGoals;
};

/**
 * Get all monthly goals with a count of weekly goals.
 * Supports filtering by seasonalGoalId.
 */
const getAllMonthlyGoalsHandler = async (page, limit, query, loggedInUser) => {
  const numberPage = Number(page) || 1;
  const numberLimit = Number(limit) || 10;
  const { seasonalGoalId } = query;

  let batchFilter = {};

  if (loggedInUser.role === 'ADMIN') {
    batchFilter = {
      seasonalGoal: {
        batch: {
          academy: {
            admins: {
              some: {
                id: loggedInUser.id,
              },
            },
          },
        },
      },
    };
  } else if (loggedInUser.role === 'COACH') {
    batchFilter = {
      seasonalGoal: {
        batch: {
          coaches: {
            some: {
              id: loggedInUser.id,
            },
          },
        },
      },
    };
  } else if (loggedInUser.role === 'STUDENT') {
    batchFilter = {
      seasonalGoal: {
        batch: {
          students: {
            some: {
              id: loggedInUser.id,
            },
          },
        },
      },
    };
  }

  if (seasonalGoalId) {
    batchFilter.seasonalGoalId = seasonalGoalId;
  }

  const monthlyGoals = await db.monthlyGoal.findMany({
    where: batchFilter,
    skip: (numberPage - 1) * numberLimit,
    take: numberLimit,
    include: {
      _count: {
        select: { weeklyGoals: true },
      },
    },
  });

  return monthlyGoals;
};

/**
 * Get all weekly goals.
 * Supports filtering by monthlyGoalId.
 */

const getAllWeeklyGoalsHandler = async (page, limit, query, loggedInUser) => {
  const numberPage = Number(page) || 1;
  const numberLimit = Number(limit) || 10;
  const { monthlyGoalId } = query;

  let batchFilter = {};

  if (loggedInUser.role === 'ADMIN') {
    batchFilter = {
      monthlyGoal: {
        seasonalGoal: {
          batch: {
            academy: {
              admins: {
                some: {
                  id: loggedInUser.id,
                },
              },
            },
          },
        },
      },
    };
  } else if (loggedInUser.role === 'COACH') {
    batchFilter = {
      monthlyGoal: {
        seasonalGoal: {
          batch: {
            coaches: {
              some: {
                id: loggedInUser.id,
              },
            },
          },
        },
      },
    };
  } else if (loggedInUser.role === 'STUDENT') {
    batchFilter = {
      monthlyGoal: {
        seasonalGoal: {
          batch: {
            students: {
              some: {
                id: loggedInUser.id,
              },
            },
          },
        },
      },
    };
  }

  if (monthlyGoalId) {
    batchFilter.monthlyGoalId = monthlyGoalId;
  }

  const weeklyGoals = await db.weeklyGoal.findMany({
    where: batchFilter,
    skip: (numberPage - 1) * numberLimit,
    take: numberLimit,
  });

  return weeklyGoals;
};

const getSeasonalGoalsForOptions = async (batchId) => {
  const seasonalGoals = await db.seasonalGoal.findMany({
    where: {
      batchId,
    },
    select: {
      id: true,
      code: true,
    },
  });

  return seasonalGoals;
};

const getMonthlyGoalsForOptions = async (seasonalGoalId) => {
  const monthlyGoals = await db.monthlyGoal.findMany({
    where: {
      seasonalGoalId: seasonalGoalId,
    },
    select: {
      id: true,
      code: true,
    },
  });

  return monthlyGoals;
};
const getWeeklyGoalsForOptions = async (batchId, monthlyGoalId) => {
  const whereClause = {};

  console.log(batchId, monthlyGoalId);

  if (batchId && monthlyGoalId) {
    whereClause.batchId = batchId;
    whereClause.monthlyGoalId = monthlyGoalId;
  } else if (batchId) {
    whereClause.batchId = batchId;
  } else if (monthlyGoalId) {
    whereClause.monthlyGoalId = monthlyGoalId;
  }

  console.log(whereClause);

  const weeklyGoals = await db.weeklyGoal.findMany({
    where: whereClause,
    select: {
      id: true,
      code: true,
    },
  });

  console.log(weeklyGoals);

  return weeklyGoals;
};

const fetchAllStudentAssignedWeeklyGoalsHandler = async (
  page,
  limit,
  query,
  loggedInUser
) => {
  const numberPage = parseInt(page) || 1;
  const numberLimit = parseInt(limit) || 10;

  const skip = (numberPage - 1) * numberLimit;

  const userWithRelations = await db.user.findUnique({
    where: { id: loggedInUser.id },
    include: {
      adminOfAcademies: {
        select: { id: true },
      },
      coachOfBatches: {
        select: { id: true },
      },
    },
  });

  if (!userWithRelations) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  let whereClause = {};

  switch (userWithRelations.role) {
    case 'SUPER_ADMIN':
      whereClause = {
        AND: [
          {
            OR: [
              {
                code: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                startDate: {
                  gte: query ? new Date(query) : undefined,
                },
              },
              {
                endDate: {
                  lte: query ? new Date(query) : undefined,
                },
              },
            ],
          },
        ],
      };
      break;

    case 'ADMIN':
      const adminAcademyIds = userWithRelations.adminOfAcademies.map(
        (academy) => academy.id
      );

      whereClause = {
        AND: [
          {
            OR: [
              {
                code: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                startDate: {
                  gte: query ? new Date(query) : undefined,
                },
              },
              {
                endDate: {
                  lte: query ? new Date(query) : undefined,
                },
              },
            ],
          },
          {
            seasonalGoal: {
              batch: {
                academyId: {
                  in: adminAcademyIds,
                },
              },
            },
          },
        ],
      };
      break;

    case 'COACH':
      const coachBatchIds = userWithRelations.coachOfBatches.map(
        (batch) => batch.id
      );

      whereClause = {
        AND: [
          {
            OR: [
              {
                code: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                startDate: {
                  gte: query ? new Date(query) : undefined,
                },
              },
              {
                endDate: {
                  lte: query ? new Date(query) : undefined,
                },
              },
            ],
          },
          {
            seasonalGoal: {
              batchId: {
                in: coachBatchIds,
              },
            },
          },
        ],
      };
      break;

    default:
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Access denied');
  }

  const total = await db.weeklyGoal.count({
    where: whereClause,
  });

  const weeklyGoals = await db.weeklyGoal.findMany({
    where: whereClause,
    skip,
    take: limit,
    include: {
      seasonalGoal: {
        include: {
          batch: {
            include: {
              academy: true,
            },
          },
        },
      },
      studentGoals: {
        include: {
          student: {
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
    },
  });

  const formattedGoals = weeklyGoals.map((goal) => ({
    id: goal.id,
    code: goal.code,
    startDate: goal.startDate,
    endDate: goal.endDate,
    seasonalGoal: {
      id: goal.seasonalGoal.id,
      code: goal.seasonalGoal.code,
      batch: {
        id: goal.seasonalGoal.batch.id,
        batchCode: goal.seasonalGoal.batch.batchCode,
        academy: {
          id: goal.seasonalGoal.batch.academy.id,
          name: goal.seasonalGoal.batch.academy.name,
        },
      },
    },
    studentGoals: goal.studentGoals.map((sg) => ({
      id: sg.id,
      puzzlesTarget: sg.puzzlesTarget,
      puzzlesSolved: sg.puzzlesSolved,
      puzzlesPassed: sg.puzzlesPassed,
      student: {
        id: sg.student.id,
        email: sg.student.email,
        firstName: sg.student.profile?.firstName,
        lastName: sg.student.profile?.lastName,
      },
    })),
  }));

  return {
    data: formattedGoals,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

const goalService = {
  assignWeeklyGoalHandler,
  createSeasonalGoalHandler,
  createMonthlyGoalHandler,
  createWeeklyGoalHandler,
  getAllSeasonalGoalsHandler,
  getAllMonthlyGoalsHandler,
  getAllWeeklyGoalsHandler,
  getSeasonalGoalsForOptions,
  getMonthlyGoalsForOptions,
  getWeeklyGoalsForOptions,
  fetchAllStudentAssignedWeeklyGoalsHandler,
};

module.exports = goalService;
