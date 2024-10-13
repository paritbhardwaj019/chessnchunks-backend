const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const _ = require('lodash');
const invitationService = require('../services/invitation.service');

const fetchAllInvitationsHandler = catchAsync(async (req, res) => {
  const { page, limit, type } = _.pick(req.query, ['page', 'limit', 'type']);

  const allInvitations = await invitationService.fetchAllInvitationsHandler(
    page,
    limit,
    type
  );

  res.status(httpStatus.OK).send(allInvitations);
});

const invitationController = {
  fetchAllInvitationsHandler,
};

module.exports = invitationController;
