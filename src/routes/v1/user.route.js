const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const userController = require('../../controllers/user.controller');
const signupLimiter = require('../../middlewares/signupLimiter');
const uploadFile = require('../../middlewares/uploadFile');

const userRouter = express.Router();

userRouter.get(
  '/all-users',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
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
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  uploadFile.single('file'),
  userController.xlsxUploadHandler
);

userRouter.patch(
  '/update-status',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  userController.updateUserStatusHandler
);

userRouter.patch(
  '/update/:id',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  userController.updateUserHandler
);

module.exports = userRouter;
