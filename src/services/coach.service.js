const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const createToken = require('../utils/createToken');
const logger = require('../utils/logger');
const config = require('../config');
const decodeToken = require('../utils/decodeToken');

const inviteCoachHandler = async (data) => {
  const { firstName, lastName, email, batchId, subRole } = data;

  // TODO: BODY VALIDATION

  const coachInvitation = await db.invitation.create({
    data: {
      data: {
        firstName,
        lastName,
        batchId,
        email,
        subRole,
      },
      email,
      type: 'BATCH_COACH',
    },
    select: {
      id: true,
      email: true,
      type: true,
      status: true,
      data: true,
    },
  });

  const token = await createToken(
    {
      id: coachInvitation.id,
    },
    config.jwt.invitationSecret,
    '3d'
  );

  logger.info(token);

  return coachInvitation;
};

const verifyCoachInvitationHandler = async (token) => {
  if (!token) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Token not present!');
  }

  const data = await decodeToken(token, config.jwt.invitationSecret);

  const coachInvitation = await db.invitation.findUnique({
    where: {
      id: data.id,
    },
    select: {
      id: true,
      data: true,
      type: true,
      status: true,
    },
  });

  if (coachInvitation.type !== 'BATCH_COACH') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token!');
  }

  if (coachInvitation.status === 'ACCEPTED') {
    throw new ApiError(
      httpStatus.ALREADY_REPORTED,
      'Invitation already accepted!'
    );
  }

  const { firstName, lastName, email, batchId, subRole } = coachInvitation.data;

  const batch = await db.batch.findUnique({
    where: {
      id: batchId,
    },
    select: {
      id: true,
    },
  });

  if (!batch) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Batch not found!');
  }

  const coachProfile = await db.profile.create({
    data: {
      firstName,
      lastName,
    },
    select: {
      id: true,
    },
  });

  const coach = await db.user.create({
    data: {
      email,
      profile: {
        connect: {
          id: coachProfile.id,
        },
      },
      coachOfBatches: {
        connect: [{ id: batch.id }],
      },
      role: 'COACH',
      subRole: subRole,
    },

    select: {
      id: true,
      email: true,
    },
  });

  const updatedBatch = await db.batch.update({
    where: {
      id: batchId,
    },
    data: {
      coaches: {
        connect: [{ id: coach.id }],
      },
    },
    select: {
      id: true,
    },
  });

  await db.invitation.update({
    where: {
      id: coachInvitation.id,
    },
    data: {
      status: 'ACCEPTED',
    },
  });

  return {
    coach,
    updatedBatch,
  };
};

const coachService = {
  inviteCoachHandler,
  verifyCoachInvitationHandler,
};

module.exports = coachService;
