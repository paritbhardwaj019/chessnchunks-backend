const httpStatus = require('http-status');
const db = require('../database/prisma');
const createToken = require('../utils/createToken');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');
const decodeToken = require('../utils/decodeToken');
const config = require('../config');

const inviteStudentHandler = async (data, loggedInUser) => {
  const { firstName, lastName, email, batchId } = data;

  const studentInvitation = await db.invitation.create({
    data: {
      data: {
        firstName,
        lastName,
        email,
        batchId,
      },
      email,
      type: 'BATCH_STUDENT',
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
      id: studentInvitation.id,
    },
    config.jwt.invitationSecret,
    '3d'
  );

  logger.info(token);

  return { studentInvitation, token };
};

const verifyStudentHandler = async (token) => {
  if (!token) throw new ApiError('Token not present!', httpStatus.BAD_REQUEST);

  const data = await decodeToken(token, config.jwt.invitationSecret);

  const studentInvitation = await db.invitation.findUnique({
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

  if (!studentInvitation)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invitation not found!');

  if (studentInvitation.type !== 'BATCH_STUDENT')
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token!');

  if (studentInvitation.status === 'ACCEPTED')
    throw new ApiError(
      httpStatus.ALREADY_REPORTED,
      'Invitation already accepted!'
    );

  const { firstName, lastName, email, batchId } = studentInvitation.data;

  const batch = await db.batch.findUnique({
    where: {
      id: batchId,
    },
    select: {
      id: true,
    },
  });

  if (!batch) throw new ApiError(httpStatus.BAD_REQUEST, 'Batch not found!');

  const studentProfile = await db.profile.create({
    data: {
      firstName,
      lastName,
    },
  });

  const newStudent = await db.user.create({
    data: {
      email,
      profile: {
        connect: {
          id: studentProfile.id,
        },
      },
      studentOfBatches: {
        connect: [
          {
            id: batch.id,
          },
        ],
      },
      role: 'STUDENT',
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
      students: {
        connect: [{ id: newStudent.id }],
      },
    },
  });

  await db.invitation.delete({
    where: {
      id: studentInvitation.id,
    },
  });

  return {
    newStudent,
    updatedBatch,
  };
};

const studentService = {
  inviteStudentHandler,
  verifyStudentHandler,
};

module.exports = studentService;
