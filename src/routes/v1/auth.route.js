const express = require('express');
const authController = require('../../controllers/auth.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');

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

authRouter.post(
  '/update-password',
  checkJWT,
  checkRole(['ADMIN', 'COACH', 'SUPER_ADMIN']),
  authController.updatePasswordHandler
);

module.exports = authRouter;
