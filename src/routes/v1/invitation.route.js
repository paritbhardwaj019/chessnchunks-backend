const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const invitationController = require('../../controllers/invitation.controller');

const invitationRouter = express.Router();

invitationRouter.get(
  '/all-invitations',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'COACH', 'ADMIN']),
  invitationController.fetchAllInvitationsHandler
);

invitationRouter.delete(
  '/:id',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'COACH', 'ADMIN']),
  invitationController.deleteInvitationHandler
);

invitationRouter.patch(
  '/:id',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'COACH', 'ADMIN']),
  invitationController.editInvitationHandler
);

module.exports = invitationRouter;
