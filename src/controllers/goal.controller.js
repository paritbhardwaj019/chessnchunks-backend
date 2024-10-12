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

const goalController = {
  assignWeeklyGoalHandler,
  createSeasonalGoalHandler,
  createMonthlyGoalHandler,
  createWeeklyGoalHandler
};

module.exports = goalController;
