const express = require('express');
const authController = require('../../controllers/auth.controller');

const authRouter = express.Router();

authRouter.post(
  '/login-with-password',
  authController.loginWithPasswordHandler
);

authRouter.post(
  '/login-without-password',
  authController.loginWithoutPasswordHandler
);

authRouter.post(
  '/verify-login',
  authController.verifyLoginWithoutPasswordHandler
);

module.exports = authRouter;
