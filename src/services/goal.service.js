const db = require('../database/prisma');

const createSeasonalGoalHandler = async (data) => {
  const { startDate, endDate, batchId } = data;

  const newStartDate = new Date(startDate);
  const newEndDate = new Date(endDate);

  const createdSeasonalGoal = await db.seasonalGoal.create({
    data: {
      startDate: newStartDate,
      endDate: newEndDate,
      batch: {
        connect: {
          id: batchId,
        },
      },
    },
  });

  return createdSeasonalGoal;
};

const createMonthlyGoalHandler = async (data) => {
  const { seasonalGoalId, startDate, endDate } = data;

  const newStartDate = new Date(startDate);
  const newEndDate = new Date(endDate);

  const createdMonthlyGoal = await db.monthlyGoal.create({
    data: {
      seasonalGoal: {
        connect: {
          id: seasonalGoalId,
        },
      },
      startDate: newStartDate,
      endDate: newEndDate,
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
          noOfGames,
          minReviews,
          maxReviews,
          midReviews,
        },
      },
    },
  });

  return createdWeeklyGoal;
};

const assignWeeklyGoalHandler = async (data) => {};

const goalService = {
  assignWeeklyGoalHandler,
  createSeasonalGoalHandler,
  createMonthlyGoalHandler,
  createWeeklyGoalHandler,
};

module.exports = goalService;
