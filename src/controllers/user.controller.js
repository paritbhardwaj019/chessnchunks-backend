const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const _ = require('lodash');
const userService = require('../services/user.service');

const fetchAllUsersHandler = catchAsync(async (req, res) => {
  const { page, limit, query } = _.pick(req.query, ['page', 'limit', 'query']);

  const allUsers = await userService.fetchAllUsersHandler(
    page,
    limit,
    query,
    req.user
  );

  res.status(httpStatus.OK).send(allUsers);
});

const signUpSubscriberHandler = catchAsync(async (req, res) => {
  const newSubscriber = await userService.signUpSubscriberHandler(req.body);
  res.status(httpStatus.CREATED).send(newSubscriber);
});

const xlsxUploadHandler = catchAsync(async (req, res) => {
  const uploadedData = await userService.createUsersFromXlsx(
    req.file,
    req.user
  );
  res.status(httpStatus.OK).send(uploadedData);
});

const updateUserStatusHandler = catchAsync(async (req, res) => {
  const { userId, status } = req.body;
  const updatedUser = await userService.updateUserStatus(userId, status);
  res.status(httpStatus.OK).send(updatedUser);
});

const userController = {
  fetchAllUsersHandler,
  signUpSubscriberHandler,
  xlsxUploadHandler,
  updateUserStatusHandler,
};

module.exports = userController;
