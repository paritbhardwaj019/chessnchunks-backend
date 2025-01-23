const httpStatus = require('http-status');
const studentReportService = require('../services/studentReport.service');
const catchAsync = require('../../../utils/catchAsync');
const {
  getAndValidateAcademy,
} = require('../../academyProgram/controllers/academyProgram.controller');

const getStudentPerformance = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);
  const filters = {
    academyId,
    timeframe: req.query.timeframe || 'weekly',
    batchId: req.query.batchId,
    searchQuery: req.query.search,
  };

  const performance =
    await studentReportService.getStudentPerformanceHandler(filters);
  res.status(httpStatus.OK).send(performance);
});

const getStudentProgress = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);
  const filters = {
    academyId,
    timeframe: req.query.timeframe || 'monthly',
    studentId: req.params.studentId,
  };

  const progress = await studentReportService.getStudentProgressHandler(
    filters.studentId,
    filters.timeframe
  );
  res.status(httpStatus.OK).send(progress);
});

const getStudentComparison = catchAsync(async (req, res) => {
  const { studentId, batchId } = req.params;

  const comparison = await studentReportService.getStudentComparisonHandler(
    studentId,
    batchId
  );
  res.status(httpStatus.OK).send(comparison);
});

// const exportStudentReport = catchAsync(async (req, res) => {
//   const academyId = await getAndValidateAcademy(req.user);
//   const { timeframe, format = 'csv' } = req.query;

//   const reportData = await studentReportService.generateReportHandler(
//     academyId,
//     timeframe,
//     format
//   );

//   const fileName = `student-report-${
//     new Date().toISOString().split('T')[0]
//   }.${format}`;

//   res.setHeader(
//     'Content-Type',
//     format === 'xlsx'
//       ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//       : 'text/csv'
//   );
//   res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

//   res.send(reportData);
// });

const studentReportController = {
  getStudentPerformance,
  getStudentProgress,
  getStudentComparison,
};

module.exports = studentReportController;
