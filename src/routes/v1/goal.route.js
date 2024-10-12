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

// PATCH routes (for editing goals)
router.patch(
  '/seasonal/:id',
  checkJWT,
  checkRole('ADMIN', 'SUPER_ADMIN'),
  goalController.editSeasonalGoalHandler
);
router.patch(
  '/monthly/:id',
  checkJWT,
  checkRole('ADMIN', 'SUPER_ADMIN'),
  goalController.editMonthlyGoalHandler
);
router.patch(
  '/weekly/:id',
  checkJWT,
  checkRole('ADMIN', 'SUPER_ADMIN'),
  goalController.editWeeklyGoalHandler
);

// DELETE routes (for deleting goals)
router.delete(
  '/seasonal/:id',
  checkJWT,
  checkRole('ADMIN', 'SUPER_ADMIN'),
  goalController.deleteSeasonalGoalHandler
);
router.delete(
  '/monthly/:id',
  checkJWT,
  checkRole('ADMIN', 'SUPER_ADMIN'),
  goalController.deleteMonthlyGoalHandler
);
router.delete(
  '/weekly/:id',
  checkJWT,
  checkRole('ADMIN', 'SUPER_ADMIN'),
  goalController.deleteWeeklyGoalHandler
);

module.exports = goalRouter;
