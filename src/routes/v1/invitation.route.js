const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const invitationController = require('../../controllers/invitation.controller');
const uploadFile = require('../../middlewares/uploadFile');

const invitationRouter = express.Router();

invitationRouter.post(
  '/xlsx-upload',
  checkJWT,
  checkRole(['SUPER_ADMIN']),
  uploadFile.single('file'),
  invitationController.xlsxUploadHandler
);

invitationRouter.get(
  '/all-invitations',
  checkJWT,
  checkRole(['SUPER_ADMIN']),
  invitationController.fetchAllInvitationsHandler
);

module.exports = invitationRouter;
