const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const goalController = require('../../controllers/goal.controller');
const checkPermission = require('../../middlewares/checkPermission');

const goalRouter = express.Router();

goalRouter.post(
  '/assign-goal-to-batch',
  checkJWT,
  checkPermission('add', '/dashboard/goals/assign-weekly'),
  goalController.assignWeeklyGoalHandler
);

goalRouter.post(
  '/create-seasonal',
  checkJWT,
  checkPermission('add', '/dashboard/goals/seasonal'),
  goalController.createSeasonalGoalHandler
);

goalRouter.post(
  '/create-monthly',
  checkJWT,
  checkPermission('add', '/dashboard/goals/monthly'),
  goalController.createMonthlyGoalHandler
);

goalRouter.post(
  '/create-weekly',
  checkJWT,
  checkPermission('add', '/dashboard/goals/weekly'),
  goalController.createWeeklyGoalHandler
);

goalRouter.get(
  '/seasonal-goals',
  checkJWT,
  checkPermission('view', '/dashboard/goals/seasonal'),
  goalController.getAllSeasonalGoalsHandler
);

goalRouter.get(
  '/monthly-goals',
  checkJWT,
  checkPermission('view', '/dashboard/goals/monthly'),
  goalController.getAllMonthlyGoalsHandler
);

goalRouter.get(
  '/weekly-goals',
  checkJWT,
  checkPermission('view', '/dashboard/goals/weekly'),
  goalController.getAllWeeklyGoalsHandler
);

goalRouter.get(
  '/seasonal-goals/options',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.getSeasonalGoalsForOptions
);

goalRouter.get(
  '/monthly-goals/options',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.getMonthlyGoalsForOptions
);

goalRouter.get(
  '/weekly-goals/options',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.getWeeklyGoalsForOptions
);

goalRouter.post(
  '/generate-student-pdf',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.generateStudentPDFReportHandler
);

goalRouter.get(
  '/student-weekly-goals',
  checkJWT,
  checkRole(['STUDENT']),
  goalController.fetchAllWeeklyGoalsHandler
);

goalRouter.get(
  '/assigned-weekly-goals',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.getAllAssignedWeeklyGoalsHandler
);

module.exports = goalRouter;
