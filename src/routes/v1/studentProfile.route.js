const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const studentProfileController = require('../../controllers/studentProfile.controller');

const studentProfileRouter = express.Router();

studentProfileRouter.get(
  '/current-subscription',
  checkJWT,
  checkRole(['STUDENT', 'SUBSCRIBER']),
  studentProfileController.getCurrentSubscriptionHandler
);

module.exports = studentProfileRouter;
