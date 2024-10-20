const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const {
  sendCoachInvitation,
  sendAcademyAdminInvitation,
  sendStudentInvitation,
} = require('../utils/invitationMailer');
const hashPassword = require('../utils/hashPassword');
const crypto = require('crypto');

const fetchAllInvitationsHandler = async (
  loggedInUser,
  page = 1,
  limit = 10,
  type,
  query
) => {
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
    const [invitations] = await Promise.all([
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

const deleteInvitation = async (loggedInUser, invitationId) => {
  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Invitation not found.');
  }

  if (invitation.createdById !== loggedInUser.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You do not have permission to delete this invitation.'
    );
  }

  try {
    await db.invitation.delete({
      where: { id: invitationId },
    });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to delete invitation.'
    );
  }
};

const editInvitation = async (loggedInUser, invitationId, newEmail) => {
  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Invitation not found.');
  }

  if (invitation.createdById !== loggedInUser.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You do not have permission to edit this invitation.'
    );
  }

  if (invitation.status === 'ACCEPTED') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot edit an invitation that has already been accepted.'
    );
  }

  if (new Date(invitation.expiresAt) < new Date()) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot edit an expired invitation.'
    );
  }

  const tempPassword = crypto.randomBytes(8).toString('hex');
  const hashedPassword = await hashPassword(tempPassword, 10);

  const newData = { email: newEmail, password: hashedPassword };
  const updatedData = Object.assign({}, invitation.data, newData);

  try {
    const updatedInvitation = await db.invitation.update({
      where: { id: invitationId },
      data: {
        email: newEmail,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
        createdBy: {
          connect: {
            id: loggedInUser.id,
          },
        },
        version: invitation.version + 1,
        data: updatedData,
      },
      select: {
        id: true,
        type: true,
        email: true,
        data: true,
        status: true,
        createdAt: true,
      },
    });

    switch (updatedInvitation.type) {
      case 'CREATE_ACADEMY':
        await sendAcademyAdminInvitation(updatedInvitation, tempPassword);
        break;
      case 'BATCH_COACH':
        await sendCoachInvitation(updatedInvitation, tempPassword);
        break;
      case 'BATCH_STUDENT':
        await sendStudentInvitation(updatedInvitation, tempPassword);
        break;
      default:
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Unknown invitation type. Cannot resend email.'
        );
    }

    return updatedInvitation;
  } catch (error) {
    console.log(error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to edit invitation.'
    );
  }
};

const invitationService = {
  fetchAllInvitationsHandler,
  editInvitation,
  deleteInvitation,
};

module.exports = invitationService;
