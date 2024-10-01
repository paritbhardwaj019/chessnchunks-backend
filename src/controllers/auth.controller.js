const httpStatus = require('http-status');
const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');

const loginWithPasswordHandler = catchAsync(async (req, res) => {
  const loggedInUser = await authService.loginWithPasswordHandler(req.body);

  res.status(httpStatus.OK).send(loggedInUser);
});
const loginWithoutPasswordHandler = catchAsync(async (req, res) => {
  const successUser = await authService.loginWithoutPasswordHandler(req.body);

  res.status(httpStatus.OK).send(successUser);
});
const verifyLoginWithoutPasswordHandler = catchAsync(async (req, res) => {
  const loggedInUser = await authService.verifyLoginWithoutPasswordHandler(
    req.body
  );

  res.status(httpStatus.OK).send(loggedInUser);
});

const authController = {
  loginWithPasswordHandler,
  loginWithoutPasswordHandler,
  verifyLoginWithoutPasswordHandler,
};

module.exports = authController;
