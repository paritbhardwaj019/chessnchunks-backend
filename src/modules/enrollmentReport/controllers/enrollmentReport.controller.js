const httpStatus = require('http-status');
const enrollmentReportService = require('../services/enrollmentReport.service');
const catchAsync = require('../../../utils/catchAsync');
const {
  getAndValidateAcademy,
} = require('../../academyProgram/controllers/academyProgram.controller');

const getCurrentSeasonEnrollments = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);
  const filters = {
    academyId,
    status: req.query.status,
    paymentStatus: req.query.paymentStatus,
  };

  const enrollments =
    await enrollmentReportService.getCurrentSeasonEnrollmentsHandler(filters);
  res.status(httpStatus.OK).send(enrollments);
});

const getNewEnrollments = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);
  const filters = {
    academyId,
    days: req.query.days ? parseInt(req.query.days) : 30,
  };

  const enrollments =
    await enrollmentReportService.getNewEnrollmentsHandler(filters);
  res.status(httpStatus.OK).send(enrollments);
});

const getWithdrawals = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);
  const filters = {
    academyId,
    days: req.query.days ? parseInt(req.query.days) : 30,
  };

  const withdrawals =
    await enrollmentReportService.getWithdrawalsHandler(filters);
  res.status(httpStatus.OK).send(withdrawals);
});

const getEnrollmentMetrics = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);
  const timeframe = req.query.timeframe ? parseInt(req.query.timeframe) : 30;

  const metrics = await enrollmentReportService.getEnrollmentMetricsHandler(
    academyId,
    timeframe
  );
  res.status(httpStatus.OK).send(metrics);
});

const getAllEnrollmentData = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);
  const timeframe = req.query.timeframe ? parseInt(req.query.timeframe) : 30;

  const [currentSeason, newEnrollments, withdrawals, metrics] =
    await Promise.all([
      enrollmentReportService.getCurrentSeasonEnrollmentsHandler({ academyId }),
      enrollmentReportService.getNewEnrollmentsHandler({ academyId }),
      enrollmentReportService.getWithdrawalsHandler({ academyId }),
      enrollmentReportService.getEnrollmentMetricsHandler(academyId, timeframe),
    ]);

  res.status(httpStatus.OK).send({
    currentSeason,
    newEnrollments,
    withdrawals,
    metrics,
  });
});

const enrollmentReportController = {
  getCurrentSeasonEnrollments,
  getNewEnrollments,
  getWithdrawals,
  getEnrollmentMetrics,
  getAllEnrollmentData,
};

module.exports = enrollmentReportController;
