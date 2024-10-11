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

module.exports = goalRouter;
