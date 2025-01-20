const express = require('express');

const batchesSnapshotController = require('../../controllers/batchSnapshot.controller');
const checkJWT = require('../../middlewares/checkJWT');

const router = express.Router();

router
  .route('/snapshot')
  .get(checkJWT, batchesSnapshotController.getBatchesSnapshot);

router
  .route('/summary/:batchId')
  .get(checkJWT, batchesSnapshotController.getBatchSummary);

router
  .route('/metrics')
  .get(checkJWT, batchesSnapshotController.getBatchMetrics);

router.route('/trends').get(checkJWT, batchesSnapshotController.getBatchTrends);

router
  .route('/export')
  .get(checkJWT, batchesSnapshotController.exportBatchReport);

module.exports = router;
