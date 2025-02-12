const Mailgen = require('mailgen');
const db = require('../database/prisma');
const createToken = require('./createToken');
const { getDomainFromAdmin } = require('./getDomainFromAdmin');
const sendMail = require('./sendEmail');
const config = require('../config');
const { SIGNUP_STATUS } = require('@prisma/client');

const processWaitingList = async (batchId, configuredDays = 3) => {
  const waitingStudent = await db.userSignup.findFirst({
    where: {
      batchInterestId: batchId,
      signupStatus: SIGNUP_STATUS.WAITING,
    },
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      interestedBatch: {
        include: {
          academy: true,
        },
      },
    },
  });

  if (!waitingStudent) {
    return false;
  }

  const reservationTime = new Date();
  const reservationExpiry = new Date(
    reservationTime.getTime() + configuredDays * 24 * 60 * 60 * 1000
  );

  await db.userSignup.update({
    where: { id: waitingStudent.id },
    data: {
      signupStatus: SIGNUP_STATUS.RESERVED,
      reservationTime,
      reservationExpiry,
      reservationPeriodHours: configuredDays * 24,
    },
  });

  const domain = getDomainFromAdmin(
    waitingStudent.interestedBatch.academy.domain
  );
  const token = await createToken(
    {
      id: waitingStudent.id,
      email: waitingStudent.email,
    },
    config.jwt.invitationSecret,
    `${configuredDays}d`
  );

  const ACTIVATION_URL = `${domain}/complete-signup?type=STUDENT&token=${token}&id=${waitingStudent.id}`;

  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Chess in Chunks',
      link: config.frontendUrl,
    },
  });

  const emailContent = {
    body: {
      name: `${waitingStudent.firstName} ${waitingStudent.lastName}`,
      intro: [
        'Good news! A spot has become available in your desired batch.',
        `You have ${configuredDays} days to complete your registration by making the payment.`,
      ],
      action: {
        instructions:
          'Please click the button below to complete your registration:',
        button: {
          color: '#22BC66',
          text: 'Complete Registration',
          link: ACTIVATION_URL,
        },
      },
      dictionary: {
        Batch: waitingStudent.interestedBatch.batchCode,
        'Reservation Expires': reservationExpiry.toLocaleString(),
      },
      outro: [
        `Please note: This reservation will expire in ${configuredDays} days.`,
        'If you do not complete the payment within this time, the spot will be offered to the next person in the waiting list.',
      ],
    },
  };

  const emailBody = mailGenerator.generate(emailContent);
  const emailText = mailGenerator.generatePlaintext(emailContent);

  await sendMail(
    waitingStudent.email,
    'Spot Available - Complete Your Chess in Chunks Registration',
    emailText,
    emailBody
  );

  return true;
};

module.exports = { processWaitingList };
