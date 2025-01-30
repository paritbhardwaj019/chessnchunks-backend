const httpStatus = require('http-status');
const coachService = require('../services/coach.service');
const catchAsync = require('../../../utils/catchAsync');

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

const fetchPaginatedCoachesHandler = catchAsync(async (req, res) => {
  const { page, limit, search, orderBy, order } = req.query;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    search: search || '',
    orderBy: orderBy || 'createdAt',
    order: order || 'desc',
  };

  const paginatedCoaches = await coachService.fetchPaginatedCoachesHandler(
    req.user,
    options
  );

  res.status(httpStatus.OK).send(paginatedCoaches);
});

const coachController = {
  inviteCoachHandler,
  verifyCoachInvitationHandler,
  fetchAllCoachesHandler,
  fetchPaginatedCoachesHandler,
};

module.exports = coachController;
