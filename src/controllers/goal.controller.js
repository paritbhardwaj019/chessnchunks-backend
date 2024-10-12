const httpStatus = require('http-status');
const goalService = require('../services/goal.service');
const catchAsync = require('../utils/catchAsync');
const _ = require('lodash');

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
  const { page, limit } = _.pick(req.query, ['page', 'limit']);

  const seasonalGoals = await goalService.getAllSeasonalGoalsHandler(
    page,
    limit,
    req.query,
    req.user
  );
  res.status(httpStatus.OK).send(seasonalGoals);
});

const getAllMonthlyGoalsHandler = catchAsync(async (req, res) => {
  const { page, limit } = _.pick(req.query, ['page', 'limit']);

  const monthlyGoals = await goalService.getAllMonthlyGoalsHandler(
    page,
    limit,
    req.query
  );
  res.status(httpStatus.OK).send(monthlyGoals);
});

const getAllWeeklyGoalsHandler = catchAsync(async (req, res) => {
  const { page, limit } = _.pick(req.query, ['page', 'limit']);

  const weeklyGoals = await goalService.getAllWeeklyGoalsHandler(
    page,
    limit,
    req.query
  );
  res.status(httpStatus.OK).send(weeklyGoals);
});

const getSeasonalGoalsForOptions = catchAsync(async (req, res) => {
  const options = await goalService.getSeasonalGoalsForOptions(req.query);
  res.status(httpStatus.OK).send(options);
});

const getMonthlyGoalsForOptions = catchAsync(async (req, res) => {
  const options = await goalService.getMonthlyGoalsForOptions(
    req.query.seasonalGoalId
  );
  res.status(httpStatus.OK).send(options);
});

const getWeeklyGoalsForOptions = catchAsync(async (req, res) => {
  const options = await goalService.getWeeklyGoalsForOptions(
    req.query.monthlyGoalId
  );
  res.status(httpStatus.OK).send(options);
});

const goalController = {
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
};

module.exports = goalController;
