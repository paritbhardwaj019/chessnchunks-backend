const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const createToken = require('../utils/createToken');
const logger = require('../utils/logger');
const config = require('../config');
const decodeToken = require('../utils/decodeToken');
const batchService = require('./batch.service');

const inviteCoachHandler = async (data, loggedInUser) => {
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
      createdBy: {
        connect: {
          id: loggedInUser.id,
        },
      },
    },
    select: {
      id: true,
      email: true,
      type: true,
      status: true,
      data: true,
      createdBy: true,
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
  console.log('COACH HITTED!!');

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

  if (!coachInvitation) return;

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

  await db.invitation.delete({
    where: {
      id: coachInvitation.id,
    },
  });

  return {
    coach,
    updatedBatch,
  };
};

const fetchAllCoachesHandler = async (loggedInUser) => {
  const selectFields = {
    id: true,
    email: true,
    subRole: true,
    profile: {
      select: {
        firstName: true,
        middleName: true,
        lastName: true,
        dob: true,
        phoneNumber: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        parentName: true,
        parentEmailId: true,
      },
    },
    coachOfBatches: {
      select: {
        id: true,
        batchCode: true,
        description: true,
        studentCapacity: true,
        currentClass: true,
        currentLevel: true,
        academy: {
          select: {
            id: true,
            name: true,
          },
        },
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    },
  };

  let coaches;

  if (loggedInUser.role === 'SUPER_ADMIN') {
    coaches = await db.user.findMany({
      where: {
        role: 'COACH',
      },
      select: selectFields,
    });
  } else if (loggedInUser.role === 'ADMIN') {
    const adminWithAcademies = await db.user.findUnique({
      where: { id: loggedInUser.id },
      select: {
        adminOfAcademies: {
          select: {
            id: true,
          },
        },
      },
    });

    if (
      !adminWithAcademies ||
      adminWithAcademies.adminOfAcademies.length === 0
    ) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Admin is not associated with any academy'
      );
    }

    const academyIds = adminWithAcademies.adminOfAcademies.map(
      (academy) => academy.id
    );

    coaches = await db.user.findMany({
      where: {
        role: 'COACH',
        coachOfBatches: {
          some: {
            academyId: { in: academyIds },
          },
        },
      },
      select: selectFields,
    });
  }

  return coaches;
};

const coachService = {
  inviteCoachHandler,
  verifyCoachInvitationHandler,
  fetchAllCoachesHandler,
};

module.exports = coachService;
