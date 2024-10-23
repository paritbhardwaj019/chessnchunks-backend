const Mailgen = require('mailgen');
const logger = require('./logger');
const sendMail = require('./sendEmail');
const config = require('../config');
const createToken = require('./createToken');
const db = require('../database/prisma');
const crypto = require('crypto');
const hashPassword = require('./hashPassword');

const generateMailGenerator = () => {
  return new Mailgen({
    theme: 'default',
    product: {
      name: 'Chess in Chunks',
      link: config.frontendUrl,
    },
  });
};

const sendAcademyAdminInvitation = async (invitation, password, version) => {
  const { firstName, lastName, email, academyName } = invitation.data;

  const token = await createToken(
    { id: invitation.id, version },
    config.jwt.invitationSecret,
    '3d'
  );

  const ACTIVATION_URL = `${
    config.frontendUrl
  }/accept-invite?type=CREATE_ACADEMY&name=${encodeURIComponent(
    academyName
  )}&token=${token}`;

  const mailGenerator = generateMailGenerator();

  const emailContent = {
    body: {
      name: `${firstName} ${lastName}`,
      intro: 'You are invited to join our academy as an admin!',
      table: {
        data: [
          { label: 'Email', value: email },
          { label: 'Temporary Password', value: password },
        ],
      },
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

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Academy Admin Invitation',
    html: emailBody,
    text: emailText,
  };

  try {
    await sendMail(
      email,
      mailOptions.subject,
      mailOptions.text,
      mailOptions.html
    );
    logger.info(`Academy admin invitation email sent to: ${email}`);
  } catch (error) {
    logger.error(
      `Failed to send academy admin invitation email to: ${email}`,
      error
    );
    throw new Error('Failed to send academy admin invitation email');
  }
};

const sendCoachInvitation = async (invitation, password, version) => {
  const { firstName, lastName, email, batchId, subRole } = invitation.data;

  const batch = await db.batch.findUnique({
    where: { id: batchId, version },
    select: {
      batchCode: true,
      academy: { select: { name: true } },
    },
  });

  if (!batch) {
    throw new Error('Batch not found for coach invitation');
  }

  const academyName = batch.academy?.name;
  const token = await createToken(
    { id: invitation.id },
    config.jwt.invitationSecret,
    '3d'
  );

  const ACTIVATION_URL = `${
    config.frontendUrl
  }/accept-invite?type=BATCH_COACH&name=${encodeURIComponent(
    `${batch.batchCode} as (${subRole}) from ${academyName}`
  )}&token=${token}`;

  const mailGenerator = generateMailGenerator();

  const emailContent = {
    body: {
      name: `${firstName} ${lastName}`,
      intro: `You are invited to join the academy "${academyName}" in the batch "${batch.batchCode}" as a coach (${subRole})!`,
      table: {
        data: [
          { label: 'Email', value: email },
          { label: 'Temporary Password', value: password },
        ],
      },
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

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Batch Coach Invitation',
    html: emailBody,
    text: emailText,
  };

  try {
    await sendMail(
      email,
      mailOptions.subject,
      mailOptions.text,
      mailOptions.html
    );
    logger.info(`Coach invitation email sent to: ${email}`);
  } catch (error) {
    logger.error(`Failed to send coach invitation email to: ${email}`, error);
    throw new Error('Failed to send coach invitation email');
  }
};

const sendStudentInvitation = async (invitation, password, version) => {
  const { firstName, lastName, email, batchId } = invitation.data;
  const batch = await db.batch.findUnique({
    where: { id: batchId },
    select: {
      batchCode: true,
      academy: { select: { name: true } },
    },
  });

  if (!batch) {
    throw new Error('Batch not found for student invitation');
  }

  const academyName = batch.academy?.name;
  const token = await createToken(
    { id: invitation.id, version },
    config.jwt.invitationSecret,
    '3d'
  );

  const ACTIVATION_URL = `${
    config.frontendUrl
  }/accept-invite?type=BATCH_STUDENT&name=${encodeURIComponent(
    `${firstName} ${lastName} from ${academyName}`
  )}&token=${token}`;

  const mailGenerator = generateMailGenerator();

  const emailContent = {
    body: {
      name: `${firstName} ${lastName}`,
      intro: `You are invited to join the academy "${academyName}" in the batch "${batch.batchCode}" as a student!`,
      table: {
        data: [
          { label: 'Email', value: email },
          { label: 'Temporary Password', value: password },
        ],
      },
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

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Batch Student Invitation',
    html: emailBody,
    text: emailText,
  };

  try {
    await sendMail(
      email,
      mailOptions.subject,
      mailOptions.text,
      mailOptions.html
    );
    logger.info(`Student invitation email sent to: ${email}`);
  } catch (error) {
    logger.error(`Failed to send student invitation email to: ${email}`, error);
    throw new Error('Failed to send student invitation email');
  }
};

module.exports = {
  sendAcademyAdminInvitation,
  sendCoachInvitation,
  sendStudentInvitation,
};