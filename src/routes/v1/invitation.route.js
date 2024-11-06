const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const invitationController = require('../../controllers/invitation.controller');
const checkPermission = require('../../middlewares/checkPermission');

const invitationRouter = express.Router();

invitationRouter.get(
  '/all-invitations',
  checkJWT,
  checkPermission('view', '/dashboard/invitations'),
  invitationController.fetchAllInvitationsHandler
);

invitationRouter.delete(
  '/:id',
  checkJWT,
  checkPermission('delete', '/dashboard/invitations'),
  invitationController.deleteInvitationHandler
);

invitationRouter.patch(
  '/:id',
  checkJWT,
  checkPermission('update', '/dashboard/invitations'),
  invitationController.editInvitationHandler
);

module.exports = invitationRouter;
