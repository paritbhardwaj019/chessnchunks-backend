const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const userController = require('../../controllers/user.controller');
const signupLimiter = require('../../middlewares/signupLimiter');
const uploadFile = require('../../middlewares/uploadFile');
const checkPermission = require('../../middlewares/checkPermission');

const userRouter = express.Router();

userRouter.get(
  '/all-users',
  checkJWT,
  checkPermission('view', '/dashboard/users'),
  userController.fetchAllUsersHandler
);

userRouter.post(
  '/signup-subscriber',
  signupLimiter,
  userController.signUpSubscriberHandler
);

userRouter.post(
  '/xlsx-upload',
  checkJWT,
  // checkPermission('add', '/dashboard/users'),
  uploadFile.single('file'),
  userController.xlsxUploadHandler
);

userRouter.patch(
  '/update-status',
  checkJWT,
  checkPermission('update', '/dashboard/users'),
  userController.updateUserStatusHandler
);

userRouter.patch(
  '/update/:id',
  checkJWT,
  checkPermission('update', '/dashboard/users'),
  userController.updateUserHandler
);

userRouter.put(
  '/profile/:id',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH', 'STUDENT', 'SUBSCRIBER']),
  uploadFile.single('profileImage'),
  userController.updateProfileHandler
);

userRouter.get(
  '/profile/:id',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH', 'STUDENT', 'SUBSCRIBER']),
  userController.fetchProfileByIdHandler
);

userRouter.patch(
  '/update-password/:id',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'COACH', 'STUDENT', 'ADMIN', 'SUBSCRIBER']),
  userController.updatePasswordHandler
);

userRouter.post(
  '/request-email-change',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH', 'STUDENT', 'SUBSCRIBER']),
  userController.requestEmailChange
);

userRouter.post(
  '/verify-email-change',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH', 'STUDENT', 'SUBSCRIBER']),
  userController.verifyEmailChange
);

userRouter.get(
  '/profile-completion/:id',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH', 'STUDENT', 'SUBSCRIBER']),
  userController.getProfileCompletionHandler
);

module.exports = userRouter;
