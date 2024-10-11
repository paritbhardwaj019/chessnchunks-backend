const httpStatus = require('http-status');
const goalService = require('../services/goal.service');
const catchAsync = require('../utils/catchAsync');

const assignWeeklyGoalHandler = catchAsync(async (req, res) => {
  const newGoal = await goalService.assignWeeklyGoalHandler(req.body);
  res.status(httpStatus.OK).send(newGoal);
});

const createSeasonalGoalHandler = catchAsync(async (req, res) => {
  const newSeasonalGoal = await goalService.createSeasonalGoalHandler(req.body);
  res.status(httpStatus.OK).send(newSeasonalGoal);
});

const createMonthlyGoalHandler = catchAsync(async (req, res) => {
  const newMonthlyGoal = await goalService.createMonthlyGoalHandler(req.body);
  res.status(httpStatus.OK).send(newMonthlyGoal);
});

const createWeeklyGoalHandler = catchAsync(async (req, res) => {
  const newWeeklyGoal = await goalService.createWeeklyGoalHandler(req.body);
  res.status(httpStatus.OK).send(newWeeklyGoal);
});

const getAllSeasonalGoalsHandler = catchAsync(async (req, res) => {
  const seasonalGoals = await goalService.getAllSeasonalGoalsHandler();
  res.status(httpStatus.OK).send(seasonalGoals);
});

const getAllMonthlyGoalsHandler = catchAsync(async (req, res) => {
  const monthlyGoals = await goalService.getAllMonthlyGoalsHandler(req.query);
  res.status(httpStatus.OK).send(monthlyGoals);
});

const getAllWeeklyGoalsHandler = catchAsync(async (req, res) => {
  const weeklyGoals = await goalService.getAllWeeklyGoalsHandler(req.query);
  res.status(httpStatus.OK).send(weeklyGoals);
});

const goalController = {
  assignWeeklyGoalHandler,
  createSeasonalGoalHandler,
  createMonthlyGoalHandler,
  createWeeklyGoalHandler,
  getAllSeasonalGoalsHandler,
  getAllMonthlyGoalsHandler,
  getAllWeeklyGoalsHandler,
};

module.exports = goalController;
