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

authRouter.post('/forgot-password', authController.resetPasswordHandler);

authRouter.post(
  '/verify-forgot-password',
  authController.verifyResetPasswordHandler
);

module.exports = authRouter;
