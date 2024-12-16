const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const studentSignupService = require('../services/studentSignup.service');
const _ = require('lodash');
const ApiError = require('../utils/apiError');
const { getAndValidateAcademy } = require('./academyProgram.controller');

const createSignupHandler = catchAsync(async (req, res) => {
  const academyId = await getAndValidateAcademy(req.user);

  const createdSignup = await studentSignupService.createSignupHandler(
    req.body,
    academyId
  );
  res.status(httpStatus.CREATED).send(createdSignup);
});

const updateSignupHandler = catchAsync(async (req, res) => {
  const updatedSignup = await studentSignupService.updateSignupHandler(
    req.params.id,
    req.body
  );
  res.status(httpStatus.OK).send(updatedSignup);
});


const updatePasswordHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'New password is required');
  }

  const updatedUser = await studentSignupService.updatePasswordHandler(id, password);
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Password updated successfully'
  });
});
const verifyEmailHandler = catchAsync(async (req, res) => {
  const verifiedSignup = await studentSignupService.verifyEmailHandler(
    req.params.id
  );
  res.status(httpStatus.OK).send(verifiedSignup);
});

const setReservationHandler = catchAsync(async (req, res) => {
  const { expiryHours } = req.body;
  const reservedSignup = await studentSignupService.setReservationHandler(
    req.params.id,
    expiryHours
  );
  res.status(httpStatus.OK).send(reservedSignup);
});

const confirmSignupHandler = catchAsync(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'userId is required');
  }

  const confirmedSignup = await studentSignupService.confirmSignupHandler(
    req.params.id,
    userId
  );
  res.status(httpStatus.OK).send(confirmedSignup);
});

const fetchAllSignups = catchAsync(async (req, res) => {
  const filters = _.pick(req.query, [
    'page',
    'limit',
    'academyId',
    'status',
    'stage',
  ]);

  const academyId = await getAndValidateAcademy(req.user);
  const signups = await studentSignupService.fetchAllSignupsHandler({
    ...filters,
    academyId,
  });
  res.status(httpStatus.OK).send(signups);
});

const fetchSignupById = catchAsync(async (req, res) => {
  const signup = await studentSignupService.fetchSignupByIdHandler(
    req.params.id
  );
  res.status(httpStatus.OK).send(signup);
});

const handleWaitlistHandler = catchAsync(async (req, res) => {
  const waitingSignups = await studentSignupService.handleWaitlistHandler(
    req.params.batchId
  );
  res.status(httpStatus.OK).send(waitingSignups);
});

const addProgramPurchase = catchAsync(async (req, res) => {
  const cartItem = await studentSignupService.addProgramPurchaseHandler(
    req.user.id,
    req.body
  );
  res.status(httpStatus.CREATED).send(cartItem);
});

const checkoutSession = catchAsync(async (req, res) => {
  const result = await studentSignupService.checkoutSessionHandler(
    req.body.programId
  );
  res.status(httpStatus.OK).send(result);
});

const getProgramCredits = catchAsync(async (req, res) => {
  const credits = await studentSignupService.getProgramCreditsHandler(
    req.user.id
  );
  res.status(httpStatus.OK).send(credits);
});

const getActiveSubscriptions = catchAsync(async (req, res) => {
  const subscriptions =
    await studentSignupService.getActiveSubscriptionsHandler(req.user.id);
  res.status(httpStatus.OK).send(subscriptions);
});

const studentSignupController = {
  createSignupHandler,
  updateSignupHandler,
  verifyEmailHandler,
  setReservationHandler,
  confirmSignupHandler,
  fetchAllSignups,
  fetchSignupById,
  addProgramPurchase,
  checkoutSession,
  getProgramCredits,
  getActiveSubscriptions,
  handleWaitlistHandler,
  updatePasswordHandler
};

module.exports = studentSignupController;
