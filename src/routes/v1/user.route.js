const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const userController = require('../../controllers/user.controller');

const userRouter = express.Router();

userRouter.get(
  '/all-users',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN']),
  userController.fetchAllUsersHandler
);

module.exports = userRouter;
