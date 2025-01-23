const express = require('express');
const batchesSnapshotController = require('../controllers/batchSnapshot.controller');
const checkJWT = require('../../../middlewares/checkJWT');

const batchReportRouter = express.Router();

batchReportRouter
  .route('/snapshot')
  .get(checkJWT, batchesSnapshotController.getBatchesSnapshot);

batchReportRouter
  .route('/summary/:batchId')
  .get(checkJWT, batchesSnapshotController.getBatchSummary);

batchReportRouter
  .route('/metrics')
  .get(checkJWT, batchesSnapshotController.getBatchMetrics);

batchReportRouter
  .route('/trends')
  .get(checkJWT, batchesSnapshotController.getBatchTrends);

batchReportRouter
  .route('/export')
  .get(checkJWT, batchesSnapshotController.exportBatchReport);

module.exports = batchReportRouter;
