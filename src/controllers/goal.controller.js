const httpStatus = require('http-status');
const goalService = require('../services/goal.service');
const catchAsync = require('../utils/catchAsync');
const _ = require('lodash');

const cleanParam = (param) => {
  if (!param || param === 'undefined') return undefined;
  return param;
};

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
    req.query,
    req.user
  );
  res.status(httpStatus.OK).send(monthlyGoals);
});

const getAllWeeklyGoalsHandler = catchAsync(async (req, res) => {
  const { page, limit } = _.pick(req.query, ['page', 'limit']);

  const weeklyGoals = await goalService.getAllWeeklyGoalsHandler(
    page,
    limit,
    req.query,
    req.user
  );
  res.status(httpStatus.OK).send(weeklyGoals);
});

const getSeasonalGoalsForOptions = catchAsync(async (req, res) => {
  const options = await goalService.getSeasonalGoalsForOptions(req.query.batchId);
  res.status(httpStatus.OK).send(options);
});

const getMonthlyGoalsForOptions = catchAsync(async (req, res) => {
  const options = await goalService.getMonthlyGoalsForOptions(req.query.seasonalGoalId);
  res.status(httpStatus.OK).send(options);
});

const getWeeklyGoalsForOptions = catchAsync(async (req, res) => {
  let { batchId, monthlyGoalId } = _.pick(req.query, [
    'batchId',
    'monthlyGoalId',
  ]);

  batchId = cleanParam(batchId);
  monthlyGoalId = cleanParam(monthlyGoalId);

  const options = await goalService.getWeeklyGoalsForOptions(batchId, monthlyGoalId);
  res.status(httpStatus.OK).send(options);
});

const fetchAllStudentAssignedWeeklyGoalsHandler = catchAsync(
  async (req, res) => {
    const { page, limit, query } = _.pick(req.query, [
      'page',
      'limit',
      'query',
    ]);

    const weeklyGoals = await goalService.fetchAllStudentAssignedWeeklyGoalsHandler(
      page,
      limit,
      query,
      req.user
    );
    res.status(httpStatus.OK).send(weeklyGoals);
  }
);

const generateStudentPDFReportHandler = catchAsync(async (req, res) => {
  const filePath = await goalService.generateStudentPDFReport(req.body);
  res.status(httpStatus.OK).send({ filePath });
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
  fetchAllStudentAssignedWeeklyGoalsHandler,
  generateStudentPDFReportHandler,
};

module.exports = goalController;
