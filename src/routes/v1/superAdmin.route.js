const express = require('express');
const superAdminController = require('../../controllers/superAdmin.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');

const superAdminRouter = express.Router();

superAdminRouter.post(
  '/invite-academy-admin',
  checkJWT,
  checkRole(['superAdmin']),
  superAdminController.inviteAcademyAdminHandler
);

superAdminRouter.post(
  '/verify-academy-admin',
  checkJWT,
  checkRole(['superAdmin']),
  superAdminController.verifyAcademyAdminHandler
);

superAdminRouter.get(
  '/all-admins',
  checkJWT,
  checkRole(['superAdmin']),
  superAdminController.fetchAllAdminsByAcademyId
);
superAdminRouter.get(
  '/all-invitations',
  checkJWT,
  checkRole(['superAdmin']),
  superAdminController.fetchAllInvitationsHandler
);
superAdminRouter.get(
  '/all-academies',
  checkJWT,
  checkRole(['superAdmin']),
  superAdminController.fetchAllAcademiesHandler
);

module.exports = superAdminRouter;
