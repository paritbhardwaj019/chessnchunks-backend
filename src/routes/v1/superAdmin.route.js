const express = require('express');
const superAdminController = require('../../controllers/superAdmin.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');

const superAdminRouter = express.Router();

superAdminRouter.post(
  '/invite-academy-admin',
  checkJWT,
  checkRole(['SUPER_ADMIN']),
  superAdminController.inviteAcademyAdminHandler
);

superAdminRouter.post(
  '/verify-academy-admin',
  superAdminController.verifyAcademyAdminHandler
);

superAdminRouter.get(
  '/all-admins',
  checkJWT,
  checkRole(['SUPER_ADMIN']),
  superAdminController.fetchAllAdminsByAcademyId
);

superAdminRouter.get(
  '/all-academies',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  superAdminController.fetchAllAcademiesHandler
);

superAdminRouter.post(
  '/plans',
  checkJWT,
  checkRole(['SUPER_ADMIN']),
  superAdminController.createPlanHandler
);

superAdminRouter.put(
  '/plans/:planId',
  checkJWT,
  checkRole(['SUPER_ADMIN']),
  superAdminController.updatePlanHandler
);

superAdminRouter.get('/plans', superAdminController.fetchAllPlansHandler);
superAdminRouter.get(
  '/check-domain',
  superAdminController.checkDomainAvailability
);
superAdminRouter.post('/select-plan', superAdminController.selectAcademyPlan);

superAdminRouter.post(
  '/create-checkout-session',
  superAdminController.createCheckoutSession
);

module.exports = superAdminRouter;
