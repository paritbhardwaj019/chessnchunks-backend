const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const batchService = require('../services/batch.service');

const createBatchHandler = catchAsync(async (req, res) => {
  const createdBatch = await batchService.createBatchHandler(req.body);
  res.status(httpStatus.OK).send(createdBatch);
});

const updateBatchHandler = catchAsync(async (req, res) => {
  const updatedBatch = await batchService.updateBatchHandler(req.params.id);
  res.status(httpStatus.OK).send(updatedBatch);
});

const deleteBatchHandler = catchAsync(async (req, res) => {
  const deletedBatch = await batchService.deleteBatchHandler(req.params.id);
  res.status(httpStatus.OK).send(deletedBatch);
});

const fetchAllBatches = catchAsync(async (req, res) => {
  const allBatches = await batchService.fetchAllBatches(req.user);

  res.status(httpStatus.OK).send(allBatches);
});

const batchController = {
  createBatchHandler,
  updateBatchHandler,
  deleteBatchHandler,
  fetchAllBatches,
};

module.exports = batchController;
