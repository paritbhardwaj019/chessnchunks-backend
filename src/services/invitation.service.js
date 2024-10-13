const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');

const fetchAllInvitationsHandler = async (page, limit, type) => {
  const allInvitations = await db.invitation.findMany({
    where: {
      type,
    },
    select: {
      id: true,
      type: true,
      email: true,
      data: true,
      status: true,
    },
  });

  return allInvitations;
};

const invitationService = { fetchAllInvitationsHandler };

module.exports = invitationService;
