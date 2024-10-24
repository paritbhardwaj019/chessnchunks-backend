const express = require('express');
const coachController = require('../../controllers/coach.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');

const coachRouter = express.Router();

coachRouter.post(
  '/invite-coach',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  coachController.inviteCoachHandler
);

coachRouter.post('/verify-coach', coachController.verifyCoachInvitationHandler);

coachRouter.get(
  '/all-coaches',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  coachController.fetchAllCoachesHandler
);

module.exports = coachRouter;
