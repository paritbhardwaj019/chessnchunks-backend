const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const dashboardController = require('../../controllers/dashboard.controller');
const checkPermission = require('../../middlewares/checkPermission');
const checkRole = require('../../middlewares/checkRole');

const dashboardRouter = express.Router();

dashboardRouter
  .route('/')
  .get(
    checkJWT,
    checkPermission('view', '/dashboard'),
    dashboardController.fetchAllDashboard
  );

dashboardRouter
  .route('/student-stats')
  .get(
    checkJWT,
    checkRole(['STUDENT']),
    dashboardController.getStudentBatchStats
  );

module.exports = dashboardRouter;
