const httpStatus = require('http-status');
const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');

const loginWithPasswordHandler = catchAsync(async (req, res) => {
  const origin = 'http://' + req.headers['x-origin-host'];

  console.log('origin', origin);

  const loggedInUser = await authService.loginWithPasswordHandler(
    req.body,
    origin
  );

  res.status(httpStatus.OK).send(loggedInUser);
});

const loginWithoutPasswordHandler = catchAsync(async (req, res) => {
  const successUser = await authService.loginWithoutPasswordHandler(
    req.body,
    req.get('host')
  );

  res.status(httpStatus.OK).send(successUser);
});
const verifyLoginWithoutPasswordHandler = catchAsync(async (req, res) => {
  console.log(req.body);

  const loggedInUser = await authService.verifyLoginWithoutPasswordHandler(
    req.body,
    req.get('host')
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

const updatePasswordHandler = catchAsync(async (req, res) => {
  const updatedUser = await authService.updatePasswordHandler(
    req.body,
    req.user
  );

  res.status(httpStatus.OK).send(updatedUser);
});

const loginWithCicIdHandler = catchAsync(async (req, res) => {
  const origin = 'http://' + req.headers['x-origin-host'];

  const loggedInUser = await authService.loginWithCicIdHandler(
    req.body,
    origin
  );

  res.status(httpStatus.OK).send(loggedInUser);
});

const authController = {
  loginWithPasswordHandler,
  loginWithoutPasswordHandler,
  verifyLoginWithoutPasswordHandler,
  resetPasswordHandler,
  verifyResetPasswordHandler,
  updatePasswordHandler,
  loginWithCicIdHandler,
};

module.exports = authController;
