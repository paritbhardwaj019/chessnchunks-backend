const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');

const fetchAllInvitationsHandler = async (
  page = 1,
  limit = 10,
  type,
  query
) => {
  if (page < 1 || limit < 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Page and limit must be positive integers.'
    );
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const where = {};

  if (type) {
    where.type = type;
  }

  if (query) {
    where.OR = [
      {
        email: {
          contains: query,
        },
      },
      {
        data: {
          path: '$.firstName',
          string_contains: query,
        },
      },
      {
        data: {
          path: '$.lastName',
          string_contains: query,
        },
      },
    ];
  }

  try {
    const [invitations, total] = await Promise.all([
      db.invitation.findMany({
        where,
        select: {
          id: true,
          type: true,
          email: true,
          data: true,
          status: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      db.invitation.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return invitations;
  } catch (error) {
    console.error('Error fetching invitations:', error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to fetch invitations.'
    );
  }
};

const invitationService = { fetchAllInvitationsHandler };

module.exports = invitationService;
