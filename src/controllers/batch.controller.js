const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const batchService = require('../services/batch.service');
const _ = require('lodash');

const createBatchHandler = catchAsync(async (req, res) => {
  const createdBatch = await batchService.createBatchHandler(req.body);
  res.status(httpStatus.OK).send(createdBatch);
});

const updateBatchHandler = catchAsync(async (req, res) => {
  console.log('PARAMS', req.params);
  console.log('BODY', req.body);
  const updatedBatch = await batchService.updateBatchHandler(
    req.params.id,
    req.body
  );
  res.status(httpStatus.OK).send(updatedBatch);
});

const deleteBatchHandler = catchAsync(async (req, res) => {
  const deletedBatch = await batchService.deleteBatchHandler(req.params.id);
  res.status(httpStatus.OK).send(deletedBatch);
});

const fetchAllBatches = catchAsync(async (req, res) => {
  const { page, limit, query } = _.pick(req.query, ['page', 'limit', 'query']);

  const allBatches = await batchService.fetchAllBatches(req.user, {
    page,
    limit,
    query,
  });

  res.status(httpStatus.OK).send(allBatches);
});

const fetchAllBatchesForOptions = catchAsync(async (req, res) => {
  const options = await batchService.fetchAllBatchesForOptions(req.user);
  res.status(httpStatus.OK).send(options);
});

const fetchBatchById = catchAsync(async (req, res) => {
  const batch = await batchService.fetchBatchById(req.params.id);
  res.status(httpStatus.OK).send(batch);
});

const batchController = {
  createBatchHandler,
  updateBatchHandler,
  deleteBatchHandler,
  fetchAllBatches,
  fetchAllBatchesForOptions,
  fetchBatchById,
};

module.exports = batchController;
