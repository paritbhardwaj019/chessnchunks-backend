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

const getWeeklyGoalsForOptions = async (monthlyGoalId) => {
  const whereClause = {};

  if (monthlyGoalId) {
    whereClause.monthlyGoalId = monthlyGoalId;
  }

  const weeklyGoals = await db.weeklyGoal.findMany({
    where: whereClause,
    select: {
      id: true,
      code: true,
    },
  });

  return weeklyGoals;
};

const editSeasonalGoal = async (id, code, description) => {
  return await db.seasonalGoal.update({
    where: { id },
    data: { code, description },
  });
};

// Edit Monthly Goal
const editMonthlyGoal = async (id, code, description) => {
  return await db.monthlyGoal.update({
    where: { id },
    data: { code, description },
  });
};

// Edit Weekly Goal
const editWeeklyGoal = async (id, code, description) => {
  return await db.weeklyGoal.update({
    where: { id },
    data: { code, description },
  });
};

// Delete Seasonal Goal
const deleteSeasonalGoal = async (id) => {
  return await db.seasonalGoal.delete({
    where: { id },
  });
};

// Delete Monthly Goal
const deleteMonthlyGoal = async (id) => {
  return await db.monthlyGoal.delete({
    where: { id },
  });
};

// Delete Weekly Goal
const deleteWeeklyGoal = async (id) => {
  return await db.weeklyGoal.delete({
    where: { id },
  });
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
  editSeasonalGoal,
  editMonthlyGoal,
  editWeeklyGoal,
  deleteSeasonalGoal,
  deleteMonthlyGoal,
  deleteWeeklyGoal,
};

module.exports = goalService;
