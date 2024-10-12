// services/student.service.js

const httpStatus = require('http-status');
const db = require('../database/prisma');
const createToken = require('../utils/createToken');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');
const decodeToken = require('../utils/decodeToken');
const config = require('../config');
const sendMail = require('../utils/sendEmail');
const Mailgen = require('mailgen');

const inviteStudentHandler = async (data, loggedInUser) => {
  const { firstName, lastName, email, batchId } = data;

  // Log the batchId for debugging
  logger.info(`Inviting student to batchId: ${batchId}`);

  // Create invitation in the database
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
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // Set expiration to 3 days
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

  // Generate token
  const token = await createToken(
    {
      id: studentInvitation.id,
    },
    config.jwt.invitationSecret,
    '3d' // Token valid for 3 days
  );

  logger.info(`Generated token for student invitation: ${token}`);

  // Fetch batch details for email content
  const batch = await db.batch.findUnique({
    where: { id: batchId },
    select: { batchCode: true, description: true },
  });

  // Add null check for batch
  if (!batch) {
    logger.error(`Batch not found with id: ${batchId}`);
    throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
  }

  // Generate activation URL
  const ACTIVATION_URL = `${
    config.frontendUrl
  }/accept-invite?type=BATCH_STUDENT&batchId=${encodeURIComponent(
    batchId
  )}&token=${token}`;

  // Generate email content
  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Your App Name',
      link: config.frontendUrl,
    },
  });

  const emailContent = {
    body: {
      name: `${firstName} ${lastName}`,
      intro: `You are invited to join the batch "${batch.batchCode}" as a student!`,
      action: {
        instructions:
          'To accept this invitation, please click the button below:',
        button: {
          color: '#22BC66',
          text: 'Accept Invitation',
          link: ACTIVATION_URL,
        },
      },
      outro: 'If you have any questions, feel free to reply to this email.',
    },
  };

  const emailBody = mailGenerator.generate(emailContent);
  const emailText = mailGenerator.generatePlaintext(emailContent);

  // Send the email using the provided sendMail function
  try {
    await sendMail(email, 'Batch Student Invitation', emailText, emailBody);
    logger.info(`Invitation email sent to student: ${email}`);
  } catch (error) {
    logger.error(`Failed to send email to student: ${email}`, error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to send invitation email'
    );
  }

  return { studentInvitation };
};

const verifyStudentHandler = async (token) => {
  if (!token) throw new ApiError(httpStatus.BAD_REQUEST, 'Token not present!');

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

  await db.invitation.update({
    where: {
      id: studentInvitation.id,
    },
    data: {
      status: 'ACCEPTED',
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
