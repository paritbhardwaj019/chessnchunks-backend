const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const userController = require('../../controllers/user.controller');
const signupLimiter = require('../../middlewares/signupLimiter');

const userRouter = express.Router();

userRouter.get(
  '/all-users',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN']),
  userController.fetchAllUsersHandler
);

userRouter.post(
  '/signup-subscriber',
  signupLimiter,
  userController.signUpSubscriberHandler
);

module.exports = userRouter;
