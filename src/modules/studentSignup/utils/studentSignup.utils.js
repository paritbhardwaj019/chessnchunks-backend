const { SIGNUP_STATUS } = require('@prisma/client');
const db = require('../../../database/prisma');
const { setReservationHandler } = require('../services/studentSignup.service');
const ApiError = require('../../../utils/apiError');
const httpStatus = require('http-status');
const sendMail = require('../../../utils/sendEmail');
const Mailgen = require('mailgen');
const config = require('../../../config');

const validateBatchCapacity = async (id) => {
  const batch = await db.batch.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          students: true,
        },
      },
      assignedUserSignups: {
        where: {
          OR: [
            { signupStatus: SIGNUP_STATUS.CONFIRMED },
            { signupStatus: SIGNUP_STATUS.RESERVED },
          ],
        },
      },
    },
  });

  if (!batch) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Batch not found');
  }

  const uniqueSignupIds = new Set(
    batch.assignedUserSignups.map((signup) => signup.id)
  );

  const totalOccupied = (batch._count.students || 0) + uniqueSignupIds.size;

  return {
    isFull: totalOccupied >= batch.studentCapacity,
    shouldWait: totalOccupied >= batch.studentCapacity,
  };
};

const processBatchCapacity = async (id) => {
  const batch = await db.batch.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          students: true,
        },
      },
      assignedUserSignups: {
        where: {
          OR: [
            { signupStatus: SIGNUP_STATUS.CONFIRMED },
            { signupStatus: SIGNUP_STATUS.RESERVED },
          ],
        },
      },
    },
  });

  const uniqueSignupIds = new Set(
    batch.assignedUserSignups.map((signup) => signup.id)
  );

  return (batch._count.students || 0) + uniqueSignupIds.size;
};

const processWaitingList = async (id, reservationPeriodInHours = 72) => {
  const nextInLine = await db.userSignup.findFirst({
    where: {
      batchInterestId: id,
      signupStatus: SIGNUP_STATUS.WAITING,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (nextInLine) {
    await setReservationHandler(nextInLine.id, reservationPeriodInHours);
  }

  return nextInLine;
};

const sendWaitingListEmail = async (signup) => {
  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Chess in Chunks',
      link: config.frontendUrl,
    },
  });

  const emailContent = {
    body: {
      name: `${signup.firstName} ${signup.lastName}`,
      intro: [
        'Thank you for your interest in Chess in Chunks!',
        'The batch you selected is currently at full capacity.',
        'You have been added to our waiting list.',
      ],
      dictionary: {
        'Batch Code': signup.interestedBatch?.batchCode || 'N/A',
        'Current Position':
          'You will be notified when a spot becomes available.',
      },
      outro: [
        'We will notify you as soon as a spot becomes available.',
        'If you have any questions, feel free to reply to this email.',
      ],
    },
  };

  const emailBody = mailGenerator.generate(emailContent);
  const emailText = mailGenerator.generatePlaintext(emailContent);

  await sendMail(
    signup.email,
    'Chess in Chunks - Waiting List Confirmation',
    emailText,
    emailBody
  );
};

module.exports = {
  processBatchCapacity,
  processWaitingList,
  validateBatchCapacity,
  sendWaitingListEmail,
};
