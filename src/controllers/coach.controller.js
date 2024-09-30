const coachService = require('../services/coach.service');
const catchAsync = require('../utils/catchAsync');

const inviteCoachHandler = catchAsync(async (req, res) => {
  const coachInvitation = await coachService.inviteCoachHandler(req.body);

  res.status(httpStatus.CREATED).send(coachInvitation);
});

const verifyCoachInvitationHandler = catchAsync(async (req, res) => {
  const verifyCoachInvitationData =
    await coachService.verifyCoachInvitationHandler(req.query.token);

  res.status(httpStatus.OK).send(verifyCoachInvitationData);
});

const coachController = {
  inviteCoachHandler,
  verifyCoachInvitationHandler,
};

module.exports = coachController;
