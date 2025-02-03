const express = require('express');
const userController = require('../controllers/user.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkPermission = require('../../../middlewares/checkPermission');
const checkRole = require('../../../middlewares/checkRole');
const signupLimiter = require('../../../middlewares/signupLimiter');
const uploadFile = require('../../../middlewares/uploadFile');
const ROLE_CONSTANT = require('../../../constants');

const userRouter = express.Router();

userRouter.get(
  '/all-users',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.SUPER_ADMIN]),
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
  checkRole([
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    ROLE_CONSTANT.ROLE.ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
    ROLE_CONSTANT.ROLE.STUDENT,
    ROLE_CONSTANT.ROLE.SUBSCRIBER,
  ]),
  uploadFile.single('profileImage'),
  userController.updateProfileHandler
);

userRouter.get(
  '/profile/:id',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    ROLE_CONSTANT.ROLE.ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
    ROLE_CONSTANT.ROLE.STUDENT,
    ROLE_CONSTANT.ROLE.SUBSCRIBER,
  ]),
  userController.fetchProfileByIdHandler
);

userRouter.patch(
  '/update-password/:id',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
    ROLE_CONSTANT.ROLE.STUDENT,
    ROLE_CONSTANT.ROLE.ADMIN,
    ROLE_CONSTANT.ROLE.SUBSCRIBER,
  ]),
  userController.updatePasswordHandler
);

userRouter.post(
  '/request-email-change',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    ROLE_CONSTANT.ROLE.ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
    ROLE_CONSTANT.ROLE.STUDENT,
    ROLE_CONSTANT.ROLE.SUBSCRIBER,
  ]),
  userController.requestEmailChange
);

userRouter.post(
  '/verify-email-change',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    ROLE_CONSTANT.ROLE.ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
    ROLE_CONSTANT.ROLE.STUDENT,
    ROLE_CONSTANT.ROLE.SUBSCRIBER,
  ]),
  userController.verifyEmailChange
);

userRouter.get(
  '/profile-completion/:id',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    ROLE_CONSTANT.ROLE.ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
    ROLE_CONSTANT.ROLE.STUDENT,
    ROLE_CONSTANT.ROLE.SUBSCRIBER,
  ]),
  userController.getProfileCompletionHandler
);

module.exports = userRouter;
