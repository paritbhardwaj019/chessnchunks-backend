const httpStatus = require('http-status');
const batchesSnapshotService = require('../services/batchSnapshot.service');
const catchAsync = require('../../../utils/catchAsync');
const academyProgramController = require('../../academyProgram/controllers/academyProgram.controller');

const getBatchesSnapshot = catchAsync(async (req, res) => {
  const filters = {
    academyId: await academyProgramController.getAndValidateAcademy(req.user),
  };

  const batchesSnapshot =
    await batchesSnapshotService.getBatchesSnapshotHandler(filters);
  res.status(httpStatus.OK).send(batchesSnapshot);
});

const getBatchSummary = catchAsync(async (req, res) => {
  if (!req.params.batchId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Batch ID is required');
  }

  const batchSummary = await batchesSnapshotService.getBatchSummaryHandler(
    req.params.batchId
  );
  res.status(httpStatus.OK).send(batchSummary);
});

const getBatchMetrics = catchAsync(async (req, res) => {
  const academyId = await academyProgramController.getAndValidateAcademy(
    req.user
  );

  const metrics = {
    total: await batchesSnapshotService.getTotalBatchesCount(academyId),
    active: await batchesSnapshotService.getActiveBatchesCount(academyId),
    nearCapacity:
      await batchesSnapshotService.getNearCapacityBatchesCount(academyId),
    requiresAttention:
      await batchesSnapshotService.getAttentionRequiredBatchesCount(academyId),
  };

  res.status(httpStatus.OK).send(metrics);
});

const getBatchTrends = catchAsync(async (req, res) => {
  const academyId = await academyProgramController.getAndValidateAcademy(
    req.user
  );
  const { timeframe = '30' } = req.query;

  const trends = await batchesSnapshotService.getBatchTrendsHandler(
    academyId,
    parseInt(timeframe)
  );
  res.status(httpStatus.OK).send(trends);
});

const exportBatchReport = catchAsync(async (req, res) => {
  const academyId = await academyProgramController.getAndValidateAcademy(
    req.user
  );
  const { format = 'csv' } = req.query;

  const reportData = await batchesSnapshotService.generateBatchReportHandler(
    academyId,
    format
  );

  res.setHeader(
    'Content-Type',
    format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=batch-report.${format}`
  );

  res.status(httpStatus.OK).send(reportData);
});

const batchesSnapshotController = {
  getBatchesSnapshot,
  getBatchSummary,
  getBatchMetrics,
  getBatchTrends,
  exportBatchReport,
};

module.exports = batchesSnapshotController;
