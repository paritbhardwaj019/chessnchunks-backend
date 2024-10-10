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

  console.log(user);

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

  await db.code.delete({
    where: {
      id: storedCode.id,
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
    },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found!');

  const resetToken = await createToken(
    { id: user.id, email: user.email },
    config.jwt.resetPasswordSecret,
    '1h'
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
