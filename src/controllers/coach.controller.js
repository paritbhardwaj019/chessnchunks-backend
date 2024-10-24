const coachService = require('../services/coach.service');
const catchAsync = require('../utils/catchAsync');
const httpStatus = require('http-status');

const inviteCoachHandler = catchAsync(async (req, res) => {
  const coachInvitation = await coachService.inviteCoachHandler(
    req.body,
    req.user
  );

  res.status(httpStatus.CREATED).send(coachInvitation);
});

const verifyCoachInvitationHandler = catchAsync(async (req, res) => {
  const verifyCoachInvitationData =
    await coachService.verifyCoachInvitationHandler(req.query.token);

  res.status(httpStatus.OK).send(verifyCoachInvitationData);
});

const fetchAllCoachesHandler = catchAsync(async (req, res) => {
  const allCoaches = await coachService.fetchAllCoachesHandler(req.user);
  res.status(httpStatus.OK).send(allCoaches);
});

const coachController = {
  inviteCoachHandler,
  verifyCoachInvitationHandler,
  fetchAllCoachesHandler,
};

module.exports = coachController;
