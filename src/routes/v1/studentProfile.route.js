const express = require('express');

const studentProfileController = require('../../controllers/studentProfile.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');

const studentProfileRouter = express.Router();

studentProfileRouter.get(
  '/current-subscription',
  checkJWT,
  checkRole(['STUDENT', 'SUBSCRIBER']),
  studentProfileController.getCurrentSubscriptionHandler
);

module.exports = studentProfileRouter;
