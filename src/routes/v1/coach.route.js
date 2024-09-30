const express = require('express');
const coachController = require('../../controllers/coach.controller');

const coachRouter = express.Router();

coachRouter.post('/invite-coach', coachController.inviteCoachHandler);

coachRouter.post('/verify-coach', coachController.verifyCoachInvitationHandler);

module.exports = coachRouter;
