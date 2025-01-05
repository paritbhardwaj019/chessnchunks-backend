const express = require('express');
const enrollmentReportController = require('../../controllers/enrollmentReport.controller');
const checkJWT = require('../../middlewares/checkJWT');

const router = express.Router();

// Base path: /api/reports/enrollments

router
  .route('/')
  .get(checkJWT, enrollmentReportController.getAllEnrollmentData);

router
  .route('/current-season')
  .get(checkJWT, enrollmentReportController.getCurrentSeasonEnrollments);

router
  .route('/new')
  .get(checkJWT, enrollmentReportController.getNewEnrollments);

router
  .route('/withdrawals')
  .get(checkJWT, enrollmentReportController.getWithdrawals);

router
  .route('/metrics')
  .get(checkJWT, enrollmentReportController.getEnrollmentMetrics);

module.exports = router;
