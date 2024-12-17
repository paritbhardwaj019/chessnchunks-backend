const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const portalSubscriberService = require('../services/portalSubscriber.service');
const _ = require('lodash');
const ApiError = require('../utils/apiError');

const createPortalSignupHandler = catchAsync(async (req, res) => {
  const createdSignup = await portalSubscriberService.createPortalSignupHandler(
    req.body
  );
  res.status(httpStatus.CREATED).send(createdSignup);
});

const verifyEmailHandler = catchAsync(async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP is required');
  }

  const verifiedSignup = await portalSubscriberService.verifyPortalSignupEmail(
    req.params.id,
    otp
  );
  res.status(httpStatus.OK).send(verifiedSignup);
});

const completeSignupHandler = catchAsync(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password is required');
  }

  const user = await portalSubscriberService.completePortalSignup(
    req.params.id,
    req.body
  );
  res.status(httpStatus.OK).send(user);
});

const resendVerificationEmail = catchAsync(async (req, res) => {
  const regeneratedOtp = await portalSubscriberService.regenerateOTP(
    req.params.id
  );
  res.status(httpStatus.OK).send({
    message: 'Verification email has been resent successfully',
  });
});

const updateSignupHandler = catchAsync(async (req, res) => {
  const updatedSignup = await portalSubscriberService.updatePortalSignupHandler(
    req.params.id,
    req.body
  );
  res.status(httpStatus.OK).send(updatedSignup);
});

const fetchPortalSignupById = catchAsync(async (req, res) => {
  const signup = await portalSubscriberService.fetchPortalSignupByIdHandler(
    req.params.id
  );
  res.status(httpStatus.OK).send(signup);
});

const fetchAllPortalSignups = catchAsync(async (req, res) => {
  const filters = _.pick(req.query, [
    'page',
    'limit',
    'search',
    'status',
    'stage',
    'role',
  ]);

  const signups =
    await portalSubscriberService.listAllPortalSubscribersForAdmin(
      filters.page || 1,
      filters.limit || 10,
      filters
    );
  res.status(httpStatus.OK).send(signups);
});

const checkEmailAvailability = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email is required');
  }

  const isAvailable = await portalSubscriberService.checkEmailAvailability(
    email
  );
  res.status(httpStatus.OK).send({ isAvailable });
});

const checkCicIdAvailability = catchAsync(async (req, res) => {
  const { cicId } = req.body;

  if (!cicId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'CIC ID is required');
  }

  const isAvailable = await portalSubscriberService.checkCicIdAvailability(
    cicId
  );
  res.status(httpStatus.OK).send({ isAvailable });
});

const checkChessComIdAvailability = catchAsync(async (req, res) => {
  const { chessComId } = req.body;

  if (!chessComId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Chess.com ID is required');
  }

  const isAvailable = await portalSubscriberService.checkChessComIdAvailability(
    chessComId
  );
  res.status(httpStatus.OK).send({ isAvailable });
});

const getActiveSubscriptions = catchAsync(async (req, res) => {
  const subscriptions =
    await portalSubscriberService.getActiveSubscriptionsHandler(req.user.id);
  res.status(httpStatus.OK).send(subscriptions);
});

const addSubscriptionPurchase = catchAsync(async (req, res) => {
  const subscription =
    await portalSubscriberService.addSubscriptionPurchaseHandler(
      req.user.id,
      req.body
    );
  res.status(httpStatus.CREATED).send(subscription);
});

const createCheckoutSession = catchAsync(async (req, res) => {
  const { planId } = req.body;

  if (!planId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Plan ID is required');
  }

  const result = await portalSubscriberService.createCheckoutSessionHandler(
    planId,
    req.user.id
  );
  res.status(httpStatus.OK).send(result);
});

const portalSubscriberController = {
  createPortalSignupHandler,
  verifyEmailHandler,
  completeSignupHandler,
  resendVerificationEmail,
  updateSignupHandler,
  fetchPortalSignupById,
  fetchAllPortalSignups,
  checkEmailAvailability,
  checkCicIdAvailability,
  checkChessComIdAvailability,
  getActiveSubscriptions,
  addSubscriptionPurchase,
  createCheckoutSession,
};

module.exports = portalSubscriberController;
