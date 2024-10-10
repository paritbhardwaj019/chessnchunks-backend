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
  console.log(req.body);

  const loggedInUser = await authService.verifyLoginWithoutPasswordHandler(
    req.body
  );

  res.status(httpStatus.OK).send(loggedInUser);
});

const resetPasswordHandler = catchAsync(async (req, res) => {
  const resetResponse = await authService.resetPasswordHandler(req.body.email);
  res.status(httpStatus.OK).send(resetResponse);
});

const verifyResetPasswordHandler = catchAsync(async (req, res) => {
  const verifyResponse = await authService.verifyResetPasswordHandler(req.body);
  res.status(httpStatus.OK).send(verifyResponse);
});

const authController = {
  loginWithPasswordHandler,
  loginWithoutPasswordHandler,
  verifyLoginWithoutPasswordHandler,
  resetPasswordHandler,
  verifyResetPasswordHandler,
};

module.exports = authController;
