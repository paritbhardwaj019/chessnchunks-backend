const express = require('express');
const batchController = require('../../controllers/batch.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');

const batchRouter = express.Router();

batchRouter
  .route('/')
  .post(
    checkJWT,
    checkRole(['SUPER_ADMIN', 'COACH']),
    batchController.createBatchHandler
  )
  .get(
    checkJWT,
    checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
    batchController.fetchAllBatches
  );

batchRouter
  .route('/:id')
  .put(
    checkJWT,
    checkRole(['SUPER_ADMIN', 'COACH']),
    batchController.updateBatchHandler
  )
  .delete(
    checkJWT,
    checkRole(['SUPER_ADMIN', 'COACH']),
    batchController.deleteBatchHandler
  );

module.exports = batchRouter;
