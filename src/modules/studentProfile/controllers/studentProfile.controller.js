const httpStatus = require('http-status');
const studentProfileService = require('../services/studentProfile.service');
const catchAsync = require('../../../utils/catchAsync');

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
