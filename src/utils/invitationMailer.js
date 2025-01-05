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

const sendAcademyAdminInvitation = async (invitation, version) => {
  const { firstName, lastName, email, academyName, signupId } = invitation.data;

  const token = await createToken(
    { id: invitation.id, version, signupId },
    config.jwt.invitationSecret,
    '3d'
  );

  const ACTIVATION_URL = `${
    config.frontendUrl
  }/accept-invite?type=CREATE_ACADEMY&name=${encodeURIComponent(
    academyName
  )}&token=${token}&signup=${signupId}`;

  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Chess in Chunks',
      link: config.frontendUrl,
    },
  });

  const emailContent = {
    body: {
      name: `${firstName} ${lastName}`,
      intro: [
        'You are invited to join Chess in Chunks as an Academy Admin!',
        'Here are the next steps to set up your academy:',
      ],
      table: {
        data: [
          {
            item: 'Step 1',
            description:
              'Click the "Accept Invitation" button below to start the setup process',
          },
          {
            item: 'Step 2',
            description: 'Choose your academy plan (Bronze, Silver, or Gold)',
          },
          {
            item: 'Step 3',
            description:
              'Select your academy domain (yourname.chessinchunks.com)',
          },
          {
            item: 'Step 4',
            description: 'Complete the payment process',
          },
        ],
      },
      action: {
        instructions:
          'To begin setting up your academy, please click the button below:',
        button: {
          color: '#22BC66',
          text: 'Accept Invitation',
          link: ACTIVATION_URL,
        },
      },
      outro: [
        "After accepting the invitation, you'll be guided through the plan selection and domain setup process.",
        'Your academy will be activated once all steps are completed.',
        'If you have any questions, feel free to reply to this email.',
      ],
    },
  };

  const emailBody = mailGenerator.generate(emailContent);
  const emailText = mailGenerator.generatePlaintext(emailContent);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to Chess in Chunks - Academy Admin Invitation',
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
  const { firstName, lastName, email, subRole, academyId } = invitation.data;

  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!academy)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Academy not found!');

  const token = await createToken(
    { id: invitation.id, version },
    config.jwt.invitationSecret,
    '3d'
  );

  const ACTIVATION_URL = `${
    config.frontendUrl
  }/accept-invite?type=BATCH_COACH&name=${encodeURIComponent(
    `${firstName} ${lastName} from ${academy.name}`
  )}&token=${token}`;

  const mailGenerator = generateMailGenerator();

  const emailContent = {
    body: {
      name: `${firstName} ${lastName}`,
      intro: `You are invited to join the academy "${academy.name}" in the batch "${batch.batchCode}" as a coach (${subRole})!`,
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
  const { firstName, lastName, email, academyId } = invitation.data;

  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: {
      id: true,
    },
  });

  if (!academy)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Academy not found!');

  const token = await createToken(
    { id: invitation.id, version },
    config.jwt.invitationSecret,
    '3d'
  );

  const ACTIVATION_URL = `${
    config.frontendUrl
  }/accept-invite?type=BATCH_STUDENT&name=${encodeURIComponent(
    `${firstName} ${lastName} from ${academy.name}`
  )}&token=${token}`;

  const mailGenerator = generateMailGenerator();

  const emailContent = {
    body: {
      name: `${firstName} ${lastName}`,
      intro: `You are invited to join the academy "${academy.name}" in the batch "${batch.batchCode}" as a student!`,
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
