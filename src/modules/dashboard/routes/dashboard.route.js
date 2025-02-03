const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkPermission = require('../../../middlewares/checkPermission');
const checkRole = require('../../../middlewares/checkRole');
const ROLE_CONSTANT = require('../../../constants');

const dashboardRouter = express.Router();

dashboardRouter.get(
  '/student/chess-stats',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.STUDENT]),
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
    checkRole([ROLE_CONSTANT.ROLE.STUDENT]),
    dashboardController.getStudentBatchStats
  );

dashboardRouter
  .route('/coach-batch-stats')
  .get(
    checkJWT,
    checkRole([ROLE_CONSTANT.ROLE.COACH]),
    dashboardController.getCoachBatchStats
  );

module.exports = dashboardRouter;
