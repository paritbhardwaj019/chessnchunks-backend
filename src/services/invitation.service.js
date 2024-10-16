const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');

const fetchAllInvitationsHandler = async (
  loggedInUser,
  page = 1,
  limit = 10,
  type,
  query
) => {
  // Validate that page and limit are positive integers
  if (
    !Number.isInteger(page) ||
    !Number.isInteger(limit) ||
    page < 1 ||
    limit < 1
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Page and limit must be positive integers.'
    );
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const where = {
    createdById: loggedInUser.id,
  };

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
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
    ]);

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
