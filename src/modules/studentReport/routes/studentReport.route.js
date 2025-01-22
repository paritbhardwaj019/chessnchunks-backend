const express = require('express');

const studentReportController = require('../../../modules/studentRepo../../modules/studentReport/controllers/studentReport.controller');
const checkJWT = require('../../middlewares/checkJWT');

const router = express.Router();

// Base path: /api/reports/students

router
  .route('/performance')
  .get(checkJWT, studentReportController.getStudentPerformance);

router
  .route('/progress/:studentId')
  .get(checkJWT, studentReportController.getStudentProgress);

router
  .route('/comparison/:studentId/:batchId')
  .get(checkJWT, studentReportController.getStudentComparison);

// router
//   .route('/export')
//   .get(checkJWT, studentReportController.exportStudentReport);

module.exports = router;
