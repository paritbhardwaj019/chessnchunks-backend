const express = require('express');
const batchController = require('../../controllers/batch.controller');

const batchRouter = express.Router();

batchRouter
  .route('/')
  .post(batchController.createBatchHandler)
  .get(batchController.fetchAllBatches);

batchRouter
  .route('/:id')
  .put(batchController.updateBatchHandler)
  .delete(batchController.deleteBatchHandler);

module.exports = batchRouter;
