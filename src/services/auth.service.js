const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const comparePassword = require('../utils/comparePassword');
const createToken = require('../utils/createToken');
const config = require('../config');
const codeGenerator = require('otp-generator');
const logger = require('../utils/logger');
const decodeToken = require('../utils/decodeToken');
const hashedPassword = require('../utils/hashPassword');
const Mailgen = require('mailgen');
const sendMail = require('../utils/sendEmail');

const loginWithPasswordHandler = async (data) => {
  const { email, password } = data;

  //   TODO: BODY VALIDATION

  const user = await db.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
      subRole: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!user || !user.password)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found!');

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials!');

  const token = await createToken(
    {
      id: user.id,
      role: user.role,
      subRole: user.subRole,
    },
    config.jwt.secret,
    '7d'
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      subRole: user.subRole,
      profile: user.profile,
    },
  };
};

const loginWithoutPasswordHandler = async (data) => {
  const { email } = data;

  //   TODO: BODY VALIDATION

  const user = await db.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      role: true,
      subRole: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found!');

  const code = codeGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
    digits: true,
  });

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  await db.code.create({
    data: {
      email: user.email,
      code,
      expiresAt,
      type: 'LOGIN_WITHOUT_PASSWORD',
    },
  });

  logger.info(code);

  return {
    user,
  };
};

const verifyLoginWithoutPasswordHandler = async (data) => {
  const { code, email } = data;

  //   TODO: BODY VALIDATION

  const storedCode = await db.code.findFirst({
    where: {
      email,
      code,
      type: 'LOGIN_WITHOUT_PASSWORD',
    },
    select: {
      id: true,
      expiresAt: true,
      email: true,
    },
  });

  if (!storedCode)
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Invalid or expired verification code!'
    );

  if (new Date() > new Date(storedCode.expiresAt))
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Verification code has expired!'
    );

  const user = await db.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      role: true,
      subRole: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found!');

  const token = await createToken(
    {
      id: user.id,
      role: user.role,
      subRole: user.subRole,
    },
    config.jwt.secret,
    '7d'
  );

  await db.code.deleteMany({
    where: {
      email,
    },
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      subRole: user.subRole,
      profile: user.profile,
    },
  };
};

const resetPasswordHandler = async (email) => {
  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      profile: true,
    },
  });

  console.log(user);

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found!');

  const resetToken = await createToken(
    { id: user.id, email: user.email },
    config.jwt.resetPasswordSecret,
    '1h'
  );

  const RESET_PASSWORD_URL = `${config.frontendUrl}/reset-password?token=${resetToken}`;

  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Chess in Chunks',
      link: config.frontendUrl,
    },
  });

  const emailContent = {
    body: {
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      intro: 'You have requested a password reset',
      action: {
        instructions: 'To reset your password, please click the button below:',
        button: {
          color: '#DC4D2F',
          text: 'Reset Password',
          link: RESET_PASSWORD_URL,
        },
      },
      outro:
        'If you did not request a password reset, please ignore this email.',
    },
  };

  const emailBody = mailGenerator.generate(emailContent);
  const emailText = mailGenerator.generatePlaintext(emailContent);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request',
    html: emailBody,
    text: emailText,
  };

  await sendMail(
    email,
    mailOptions.subject,
    mailOptions.text,
    mailOptions.html
  );

  logger.info(resetToken);

  return {
    resetToken,
  };
};

const verifyResetPasswordHandler = async (data) => {
  const { token, newPassword } = data;

  const decoded = await decodeToken(token, config.jwt.resetPasswordSecret);

  if (!decoded || !decoded.id)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token!');

  const { id, email } = decoded;

  const user = await db.user.findUnique({
    where: { id, email },
    select: { id: true, email: true, password: true },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found!');

  const newUpdatePassword = await hashedPassword(newPassword, 10);

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: { password: newUpdatePassword },
    select: {
      id: true,
      email: true,
    },
  });

  return { updatedUser };
};

const authService = {
  loginWithPasswordHandler,
  loginWithoutPasswordHandler,
  verifyLoginWithoutPasswordHandler,
  resetPasswordHandler,
  verifyResetPasswordHandler,
};

module.exports = authService;
