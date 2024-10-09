const express = require('express');
const coachController = require('../../controllers/coach.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');

const coachRouter = express.Router();

coachRouter.post(
  '/invite-coach',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN']),
  coachController.inviteCoachHandler
);

coachRouter.post('/verify-coach', coachController.verifyCoachInvitationHandler);

module.exports = coachRouter;
