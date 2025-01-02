const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const _ = require('lodash');
const userService = require('../services/user.service');
const academyService = require('../services/academy.service');

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
  console.log('req==>', req.params.id);
  const id = await req.params.id;
  const updatedUser = await userService.updatePasswordHandler(
    {
      ...req.body,
      userId: id,
    },
    req.user
  );
  res.status(httpStatus.OK).send(updatedUser);
});

const requestEmailChange = catchAsync(async (req, res) => {
  console.log('REQ_BODY', req.body);

  const { newEmail } = req.body;

  const academy = await academyService.getSingleAcademyForUser(req.user);
  const academyDomain = academy.domain;

  const result = await userService.requestEmailChangeHandler(
    req.user.id,
    newEmail,
    academyDomain
  );

  res.status(httpStatus.OK).send(result);
});

const verifyEmailChange = catchAsync(async (req, res) => {
  const { token } = req.body;
  const result = await userService.verifyEmailChangeHandler(req.user.id, token);
  res.status(httpStatus.OK).send(result);
});

const getProfileCompletionHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const profileCompletion = await userService.getProfileCompletionHandler(id);
  res.status(httpStatus.OK).send(profileCompletion);
});

const updateProfileHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const profileData = req.body;

  const profileImage = req.file;
  if (profileImage) {
    profileData.profileImage = profileImage;
  }

  const updatedUser = await userService.updateProfileHandler(
    id,
    profileData,
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
  requestEmailChange,
  verifyEmailChange,
  getProfileCompletionHandler,
  updateProfileHandler,
};

module.exports = userController;
