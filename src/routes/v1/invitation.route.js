const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const invitationController = require('../../controllers/invitation.controller');

const invitationRouter = express.Router();

invitationRouter.post(
  '/bulk-user-upload',
  checkJWT,
  checkRole(['SUPER_ADMIN']),
  invitationController.bulkUserUploadHandler
);

module.exports = invitationRouter;
