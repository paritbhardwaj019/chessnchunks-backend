const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const _ = require('lodash');
const invitationService = require('../services/invitation.service');

const fetchAllInvitationsHandler = catchAsync(async (req, res) => {
  let { page, limit, type, query } = _.pick(req.query, [
    'page',
    'limit',
    'type',
    'query',
  ]);

  page = 1;
  limit = 10;

  const allInvitations = await invitationService.fetchAllInvitationsHandler(
    req.user,
    page,
    limit,
    type,
    query
  );

  res.status(httpStatus.OK).send(allInvitations);
});

const deleteInvitationHandler = catchAsync(async (req, res) => {
  const { id } = req.params;

  await invitationService.deleteInvitation(req.user, id);

  res.status(httpStatus.NO_CONTENT).send();
});

const editInvitationHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { email } = _.pick(req.body, ['email']);

  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email is required.');
  }

  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid email format.');
  }

  const updatedInvitation = await invitationService.editInvitation(
    req.user,
    id,
    email
  );

  res.status(httpStatus.OK).send(updatedInvitation);
});

const invitationController = {
  fetchAllInvitationsHandler,
  deleteInvitationHandler,
  editInvitationHandler,
};

module.exports = invitationController;
