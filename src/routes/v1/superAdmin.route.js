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
  checkRole(['SUPER_ADMIN', 'ADMIN']),
  superAdminController.fetchAllAcademiesHandler
);

module.exports = superAdminRouter;
