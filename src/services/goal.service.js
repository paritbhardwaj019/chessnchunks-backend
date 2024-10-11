const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');

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

/**
 * Get all seasonal goals with a count of monthly goals.
 */
const getAllSeasonalGoalsHandler = async () => {
  const seasonalGoals = await db.seasonalGoal.findMany({
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
const getAllMonthlyGoalsHandler = async (query) => {
  const { seasonalGoalId } = query;

  const whereClause = {};
  if (seasonalGoalId) {
    whereClause.seasonalGoalId = seasonalGoalId;
  }

  const monthlyGoals = await db.monthlyGoal.findMany({
    where: whereClause,
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

const getAllWeeklyGoalsHandler = async (query) => {
  const { monthlyGoalId } = query;

  const whereClause = {};
  if (monthlyGoalId) {
    whereClause.monthlyGoalId = monthlyGoalId;
  }

  const weeklyGoals = await db.weeklyGoal.findMany({
    where: whereClause,
  });

  return weeklyGoals;
};

const goalService = {
  assignWeeklyGoalHandler,
  createSeasonalGoalHandler,
  createMonthlyGoalHandler,
  createWeeklyGoalHandler,
  getAllSeasonalGoalsHandler,
  getAllMonthlyGoalsHandler,
  getAllWeeklyGoalsHandler,
};

module.exports = goalService;
