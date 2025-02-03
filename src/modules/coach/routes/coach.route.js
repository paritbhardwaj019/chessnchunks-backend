const express = require('express');
const coachController = require('../controllers/coach.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkPermission = require('../../../middlewares/checkPermission');
const checkRole = require('../../../middlewares/checkRole');
const ROLE_CONSTANT = require('../../../constants');

const coachRouter = express.Router();

coachRouter.post(
  '/invite-coach',
  checkJWT,
  checkPermission('add', '/dashboard/users'),
  coachController.inviteCoachHandler
);

coachRouter.post('/verify-coach', coachController.verifyCoachInvitationHandler);

coachRouter.get(
  '/all-coaches',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    ROLE_CONSTANT.ROLE.ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
  ]),
  coachController.fetchAllCoachesHandler
);

coachRouter.get(
  '/coaches',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    ROLE_CONSTANT.ROLE.ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
  ]),
  coachController.fetchPaginatedCoachesHandler
);

module.exports = coachRouter;
