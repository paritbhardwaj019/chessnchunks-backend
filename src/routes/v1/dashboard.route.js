const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const dashboardController = require('../../controllers/dashboard.controller');
const checkPermission = require('../../middlewares/checkPermission');
const checkRole = require('../../middlewares/checkRole');

const dashboardRouter = express.Router();

dashboardRouter.get(
  '/student/chess-stats',
  checkJWT,
  checkRole(['STUDENT']),
  dashboardController.getStudentChessStatsHandler
);

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

dashboardRouter
  .route('/coach-batch-stats')
  .get(checkJWT, checkRole(['COACH']), dashboardController.getCoachBatchStats);

module.exports = dashboardRouter;
