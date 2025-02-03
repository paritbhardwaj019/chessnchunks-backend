const express = require('express');
const studentProfileController = require('../controllers/studentProfile.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkRole = require('../../../middlewares/checkRole');
const ROLE_CONSTANT = require('../../../constants');

const studentProfileRouter = express.Router();

studentProfileRouter.get(
  '/current-subscription',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.STUDENT, ROLE_CONSTANT.ROLE.SUBSCRIBER]),
  studentProfileController.getCurrentSubscriptionHandler
);

module.exports = studentProfileRouter;
