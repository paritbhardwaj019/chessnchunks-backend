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

const updateUserHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userData = req.body;

  const updatedUser = await userService.updateUserHandler(
    id,
    userData,
    req.user
  );

  res.status(httpStatus.OK).send(updatedUser);
});

const fetchProfileByIdHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await userService.fetchProfileById(id, req.user);
  res.status(httpStatus.OK).send(user);
});

const updatePasswordHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updatedUser = await userService.updatePasswordHandler(
    {
      ...req.body,
      userId: id,
    },
    req.user
  );
  res.status(httpStatus.OK).send(updatedUser);
});

const userController = {
  fetchAllUsersHandler,
  signUpSubscriberHandler,
  xlsxUploadHandler,
  updateUserStatusHandler,
  updateUserHandler,
  fetchProfileByIdHandler,
  updatePasswordHandler,
};

module.exports = userController;
