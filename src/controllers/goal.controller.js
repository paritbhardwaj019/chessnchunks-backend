const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const goalService = require('../services/goalService');

// Controller functions

// Assign Weekly Goal
const assignWeeklyGoal = catchAsync(async (req, res) => {
  const newGoal = await goalService.assignWeeklyGoalHandler(req.body);
  res.status(httpStatus.OK).send(newGoal);
});

// Create Seasonal Goal
const createSeasonalGoal = catchAsync(async (req, res) => {
  const newGoal = await goalService.createSeasonalGoalHandler(req.body);
  res.status(httpStatus.CREATED).send(newGoal);
});

// Create Monthly Goal
const createMonthlyGoal = catchAsync(async (req, res) => {
  const newGoal = await goalService.createMonthlyGoalHandler(req.body);
  res.status(httpStatus.CREATED).send(newGoal);
});

// Create Weekly Goal
const createWeeklyGoal = catchAsync(async (req, res) => {
  const newGoal = await goalService.createWeeklyGoalHandler(req.body);
  res.status(httpStatus.CREATED).send(newGoal);
});

// Get all Seasonal Goals
const getAllSeasonalGoals = catchAsync(async (req, res) => {
  const goals = await goalService.getAllSeasonalGoalsHandler(
    req.query.page,
    req.query.limit,
    req.query,
    req.user
  );
  res.status(httpStatus.OK).send(goals);
});

// Get all Monthly Goals
const getAllMonthlyGoals = catchAsync(async (req, res) => {
  const goals = await goalService.getAllMonthlyGoalsHandler(
    req.query.page,
    req.query.limit,
    req.query,
    req.user
  );
  res.status(httpStatus.OK).send(goals);
});

// Get all Weekly Goals
const getAllWeeklyGoals = catchAsync(async (req, res) => {
  const goals = await goalService.getAllWeeklyGoalsHandler(
    req.query.page,
    req.query.limit,
    req.query,
    req.user
  );
  res.status(httpStatus.OK).send(goals);
});

// Get Seasonal Goals for Options
const getSeasonalGoalsOptions = catchAsync(async (req, res) => {
  const goals = await goalService.getSeasonalGoalsForOptions(req.query.batchId);
  res.status(httpStatus.OK).send(goals);
});

// Get Monthly Goals for Options
const getMonthlyGoalsOptions = catchAsync(async (req, res) => {
  const goals = await goalService.getMonthlyGoalsForOptions(
    req.query.seasonalGoalId
  );
  res.status(httpStatus.OK).send(goals);
});

// Get Weekly Goals for Options
const getWeeklyGoalsOptions = catchAsync(async (req, res) => {
  const goals = await goalService.getWeeklyGoalsForOptions(
    req.query.monthlyGoalId
  );
  res.status(httpStatus.OK).send(goals);
});

// Edit Seasonal Goal
const editSeasonalGoal = catchAsync(async (req, res) => {
  const updatedGoal = await goalService.editSeasonalGoalHandler(
    req.params.id,
    req.body
  );
  res.status(httpStatus.OK).send(updatedGoal);
});

// Edit Monthly Goal
const editMonthlyGoal = catchAsync(async (req, res) => {
  const updatedGoal = await goalService.editMonthlyGoalHandler(
    req.params.id,
    req.body
  );
  res.status(httpStatus.OK).send(updatedGoal);
});

// Edit Weekly Goal
const editWeeklyGoal = catchAsync(async (req, res) => {
  const updatedGoal = await goalService.editWeeklyGoalHandler(
    req.params.id,
    req.body
  );
  res.status(httpStatus.OK).send(updatedGoal);
});

// Delete Seasonal Goal
const deleteSeasonalGoal = catchAsync(async (req, res) => {
  await goalService.deleteSeasonalGoalHandler(req.params.id);
  res
    .status(httpStatus.OK)
    .send({ message: 'Seasonal goal deleted successfully' });
});

// Delete Monthly Goal
const deleteMonthlyGoal = catchAsync(async (req, res) => {
  await goalService.deleteMonthlyGoalHandler(req.params.id);
  res
    .status(httpStatus.OK)
    .send({ message: 'Monthly goal deleted successfully' });
});

// Delete Weekly Goal
const deleteWeeklyGoal = catchAsync(async (req, res) => {
  await goalService.deleteWeeklyGoalHandler(req.params.id);
  res
    .status(httpStatus.OK)
    .send({ message: 'Weekly goal deleted successfully' });
});

module.exports = {
  assignWeeklyGoal,
  createSeasonalGoal,
  createMonthlyGoal,
  createWeeklyGoal,
  getAllSeasonalGoals,
  getAllMonthlyGoals,
  getAllWeeklyGoals,
  getSeasonalGoalsOptions,
  getMonthlyGoalsOptions,
  getWeeklyGoalsOptions,
  editSeasonalGoal,
  editMonthlyGoal,
  editWeeklyGoal,
  deleteSeasonalGoal,
  deleteMonthlyGoal,
  deleteWeeklyGoal,
};
