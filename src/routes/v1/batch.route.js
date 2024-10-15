const express = require('express');
const batchController = require('../../controllers/batch.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');

const batchRouter = express.Router();

batchRouter.get(
  '/options',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  batchController.fetchAllBatchesForOptions
);

batchRouter.post(
  '/:id/students',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  batchController.addStudentToBatchHandler
);

batchRouter.post(
  '/:id/coaches',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN']),
  batchController.addCoachToBatchHandler
);

batchRouter.get(
  '/:id/coaches',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  batchController.getAllCoachesByBatchIdHandler
);

batchRouter
  .route('/')
  .post(
    checkJWT,
    checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
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
  )
  .get(
    checkJWT,
    checkRole(['SUPER_ADMIN', 'COACH', 'ADMIN']),
    batchController.fetchBatchById
  );

module.exports = batchRouter;
