const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const goalController = require('../../controllers/goal.controller');

const goalRouter = express.Router();

goalRouter.post(
  '/assign-goal-to-batch',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.assignWeeklyGoalHandler
);

goalRouter.post(
  '/create-seasonal',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.createSeasonalGoalHandler
);

goalRouter.post(
  '/create-monthly',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.createMonthlyGoalHandler
);

goalRouter.post(
  '/create-weekly',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.createWeeklyGoalHandler
);

goalRouter.get(
  '/seasonal-goals',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.getAllSeasonalGoalsHandler
);

goalRouter.get(
  '/monthly-goals',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.getAllMonthlyGoalsHandler
);

goalRouter.get(
  '/weekly-goals',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
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

goalRouter.get(
  '/student-weekly-goals',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.fetchAllStudentAssignedWeeklyGoalsHandler
);

// New route to generate PDF report for student goals
goalRouter.post(
  '/generate-student-pdf',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.generateStudentPDFReportHandler
);

module.exports = goalRouter;
