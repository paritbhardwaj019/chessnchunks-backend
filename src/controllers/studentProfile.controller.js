const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const studentProfileService = require('../services/studentProfile.service');

const getCurrentSubscriptionHandler = catchAsync(async (req, res) => {
  const subscriptions = await studentProfileService.getCurrentSubscription(
    req.user
  );
  res.status(httpStatus.OK).send(subscriptions);
});

const studentProfileController = {
  getCurrentSubscriptionHandler,
};

module.exports = studentProfileController;
