const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const hashPassword = require('../utils/hashPassword');
const httpStatus = require('http-status');
const xlsx = require('xlsx');
const fs = require('fs');
const formatNumberWithPrefix = require('../utils/formatNumberWithPrefix');
const comparePassword = require('../utils/comparePassword');
const { getSingleAcademyForUser } = require('./academy.service');
const crypto = require('crypto');
const { ROLE } = require('@prisma/client');

const createToken = require('../utils/createToken');
const Mailgen = require('mailgen');
const sendMail = require('../utils/sendEmail');
const generateSystemCode = require('../utils/generateSystemCode');
const { sendSignupEmail } = require('./studentSignup.service');
const config = require('../config');

const fetchAllUsersHandler = async (page, limit, query, loggedInUser) => {
  const numberPage = Number(page) || 1;
  const numberLimit = Number(limit) || 10;
  const skip = (numberPage - 1) * numberLimit;
  const take = numberLimit;

  const baseFilter = {
    NOT: { id: loggedInUser.id },
    OR: [
      { email: { contains: query } },
      { profile: { firstName: { contains: query } } },
      { profile: { lastName: { contains: query } } },
    ],
  };

  const selectFields = {
    id: true,
    email: true,
    role: {
      select: {
        name: true,
      },
    },
    subRole: true,
    profile: {
      select: {
        firstName: true,
        lastName: true,
      },
    },
    createdAt: true,
    updatedAt: true,
    status: true,
    code: true,
    adminOfAcademies: {
      select: {
        id: true,
        name: true,
      },
    },
    assignedToAcademy: {
      select: {
        id: true,
        name: true,
      },
    },
  };

  let allUsers = [];

  const user = await db.user.findUnique({
    where: { id: loggedInUser.id },
    include: {
      adminOfAcademies: true,
      coachOfBatches: true,
      role: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  if (user.role.name === 'SUPER_ADMIN') {
    allUsers = await db.user.findMany({
      skip,
      take,
      where: baseFilter,
      select: selectFields,
    });
  } else if (user.role.name === 'ADMIN' || user.role.name === 'COACH') {
    const academy = await getSingleAcademyForUser(loggedInUser);

    allUsers = await db.user.findMany({
      skip,
      take,
      where: {
        ...baseFilter,
        assignedToAcademyId: academy.id,
      },
      select: selectFields,
    });
  } else {
    allUsers = [];
  }

  const usersWithAcademies = allUsers.map((u) => {
    let academy = null;

    if (u.role.name === 'ADMIN') {
      academy = u.adminOfAcademies[0];
    } else if (u.role.name === 'COACH' || u.role.name === 'STUDENT') {
      academy = u.assignedToAcademy;
    }

    delete u.adminOfAcademies;
    delete u.assignedToAcademy;

    return {
      ...u,
      academy,
    };
  });

  return {
    allUsers: usersWithAcademies,
  };
};

const signUpSubscriberHandler = async (data) => {
  const {
    email,
    password,
    firstName,
    lastName,
    dateOfBirth,
    phoneNumber,
    addressLine1,
    addressLine2,
    city,
    state,
    country,
  } = data;

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, 'Email is already in use');
  }

  const hashedPassword = await hashPassword(password, 10);

  const newDOB = new Date(dateOfBirth);

  const profile = await db.profile.create({
    data: {
      firstName,
      lastName,
      dateOfBirth: newDOB,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
    },
  });

  const userCount = await db.user.count();
  const newCode = formatNumberWithPrefix('U', userCount);

  const isEmailAlreadyExists = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (isEmailAlreadyExists) {
    throw new ApiError(httpStatus.CONFLICT, 'Email is already taken.');
  }

  const subscriberRole = await db.role.findFirst({
    where: {
      name: 'SUBSCRIBER',
    },
  });

  const user = await db.user.create({
    data: {
      email,
      password: hashedPassword,
      code: newCode,
      role: {
        id: subscriberRole.id,
      },
      profile: {
        connect: { id: profile.id },
      },
    },
  });

  return { user };
};

const createUsersFromXlsx = async (file, loggedInUser) => {
  if (!file || !file.path) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'File is missing!');
  }

  const user = await db.user.findUnique({
    where: { id: loggedInUser.id },
    include: {
      adminOfAcademies: true,
      assignedToAcademy: true,
      role: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found.');
  }

  let academyId = null;

  if (user.role.name === 'ADMIN') {
    if (user.adminOfAcademies.length === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'User is not associated with any academy.'
      );
    }
    academyId = user.adminOfAcademies[0].id;
  } else {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'User role does not have permission to create users.'
    );
  }

  const ROLE_MAPPING = {
    1: 'COACH',
    2: 'STUDENT',
  };

  const COACH_SUB_ROLE_MAPPING = {
    1: 'HEAD_COACH',
    2: 'SENIOR_COACH',
    3: 'JUNIOR_COACH',
    4: 'PUZZLE_MASTER',
    5: 'PUZZLE_MASTER_SCHOLAR',
  };

  const workbook = xlsx.readFile(file.path);
  const sheetNames = workbook.SheetNames;

  const coachesCreated = [];
  const studentsCreated = [];
  const errors = [];

  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    for (const row of jsonData) {
      const firstName = row['FIRST NAME'];
      const lastName = row['LAST NAME'];
      const email = row['EMAIL'];
      const phoneNumber = row['PHONE NUMBER'];
      const roleNumber = row['ROLE'];
      const subRole = row['SUB_ROLE'];

      try {
        if (!email || !firstName || !lastName || !phoneNumber || !roleNumber) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
        }

        const role = ROLE_MAPPING[roleNumber];
        if (!role || !['COACH', 'STUDENT'].includes(role)) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Invalid role number - ${roleNumber}`
          );
        }

        const isEmailExists = await db.user.findUnique({
          where: { email },
        });

        if (isEmailExists) {
          throw new ApiError(httpStatus.CONFLICT, 'Email is already taken.');
        }

        if (role === 'COACH') {
          const tempPassword = crypto.randomBytes(8).toString('hex');
          const hashedPassword = await hashPassword(tempPassword, 10);

          const coachInvitation = await db.invitation.create({
            data: {
              data: {
                firstName,
                lastName,
                email,
                phoneNumber,
                academyId,
                password: hashedPassword,
                subRole: COACH_SUB_ROLE_MAPPING[subRole],
              },
              email,
              type: 'BATCH_COACH',
              expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
              createdBy: {
                connect: { id: loggedInUser.id },
              },
            },
          });

          const token = await createToken(
            { id: coachInvitation.id, version: coachInvitation.version },
            config.jwt.invitationSecret,
            '3d'
          );

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
              intro: 'You are invited to join as a coach!',
              table: {
                data: [
                  { label: 'Email', value: email },
                  { label: 'Temporary Password', value: tempPassword },
                ],
              },
              action: {
                instructions:
                  'To accept this invitation and complete your profile, please click the button below:',
                button: {
                  color: '#22BC66',
                  text: 'Accept Invitation',
                  link: `${config.frontendUrl}/accept-invite?type=BATCH_COACH&token=${token}`,
                },
              },
              outro:
                'After logging in, you will be prompted to complete your profile with additional information.',
            },
          };

          await sendMail(
            email,
            'Coach Invitation',
            mailGenerator.generatePlaintext(emailContent),
            mailGenerator.generate(emailContent)
          );

          coachesCreated.push({
            email,
            firstName,
            lastName,
            role: 'COACH',
          });
        } else if (role === 'STUDENT') {
          const signupId = await generateSystemCode(SYSTEM_CODE_MODULE.STUDENT);
          const expiryDate = new Date();
          expiryDate.setHours(expiryDate.getHours() + 72);

          const signup = await db.userSignup.create({
            data: {
              email,
              signupId,
              firstName,
              lastName,
              phoneNumber,
              userRole: ROLE.STUDENT,
              signupStage: REGISTRATION_STAGE.INQUIRY,
              signupStatus: SIGNUP_STATUS.INQUIRY,
              academy: {
                connect: { id: academyId },
              },
              reservationExpiry: expiryDate,
            },
          });

          const otp = generateOTP(6);
          const otpExpiryTime = new Date();
          otpExpiryTime.setHours(otpExpiryTime.getHours() + 72);

          await db.signupOTP.create({
            data: {
              email,
              otp,
              expiresAt: otpExpiryTime,
              verified: false,
            },
          });

          await sendSignupEmail(signup, otp);

          studentsCreated.push({
            email,
            firstName,
            lastName,
            role: 'STUDENT',
            signupId: signup.signupId,
          });
        }
      } catch (error) {
        console.log(error);
        errors.push({
          email,
          firstName,
          lastName,
          roleNumber,
          error: error.message,
        });
      }
    }
  }

  fs.unlinkSync(file.path);

  return {
    coachesCreated,
    studentsCreated,
    errors,
  };
};

const updateUserStatus = async (userId, status) => {
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    throw new Error(
      'Invalid status. Status must be either ACTIVE or INACTIVE.'
    );
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: { status },
  });

  return updatedUser;
};

const updateUserHandler = async (id, userData, loggedInUser) => {
  const { email, firstName, lastName, role, subRole, status } = userData;

  console.log('USER DATA', userData);

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User ID is required.');
  }

  const user = await db.user.findUnique({
    where: { id },
    include: { profile: true, coachOfBatches: true, studentOfBatches: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  if (loggedInUser.role !== 'SUPER_ADMIN') {
    if (loggedInUser.role === 'ADMIN') {
      const adminAcademyIds = loggedInUser.adminOfAcademies.map(
        (academy) => academy.id
      );
      const userAcademyIds = [
        ...user.adminOfAcademies.map((academy) => academy.id),
        ...user.coachOfBatches.map((batch) => batch.academyId),
        ...user.studentOfBatches.map((batch) => batch.academyId),
      ];

      const isAuthorized = userAcademyIds.some((academyId) =>
        adminAcademyIds.includes(academyId)
      );

      if (!isAuthorized) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          'You do not have permission to update this user.'
        );
      }
    } else {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'You do not have permission to update this user.'
      );
    }
  }

  const updateData = {};

  if (email && email !== user.email) {
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser && existingUser.id !== id) {
      throw new ApiError(httpStatus.CONFLICT, 'Email is already in use.');
    }
    updateData.email = email;
  }

  if (role) {
    const existingRole = await db.role.findUnique({
      where: { name: role.name },
    });

    if (!existingRole) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid role name.');
    }

    updateData.role = {
      connect: { name: role.name },
    };
  }

  if (subRole) {
    updateData.subRole = subRole;
  }

  if (status) {
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Invalid status. Status must be either ACTIVE or INACTIVE.'
      );
    }
    updateData.status = status;
  }

  if (firstName || lastName) {
    if (user.profile) {
      updateData.profile = {
        update: {},
      };
      if (firstName) updateData.profile.update.firstName = firstName;
      if (lastName) updateData.profile.update.lastName = lastName;
    } else {
      updateData.profile = {
        create: {
          firstName: firstName,
          lastName: lastName,
        },
      };
    }
  }

  console.log('---UPDATE-DATA---', updateData);

  const updatedUser = await db.user.update({
    where: { id },
    data: updateData,
    include: {
      profile: true,
      coachOfBatches: true,
      studentOfBatches: true,
    },
  });

  return updatedUser;
};

const fetchProfileById = async (id, loggedInUser) => {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      profile: true,
      adminOfAcademies: true,
      coachOfBatches: true,
      studentOfBatches: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  if (loggedInUser.role !== 'SUPER_ADMIN') {
    if (loggedInUser.role === 'ADMIN') {
      const adminAcademyIds = loggedInUser.adminOfAcademies.map(
        (academy) => academy.id
      );
      const userAcademyIds = [
        ...user.adminOfAcademies.map((academy) => academy.id),
        ...user.coachOfBatches.map((batch) => batch.academyId),
        ...user.studentOfBatches.map((batch) => batch.academyId),
      ];

      const isAuthorized = userAcademyIds.some((academyId) =>
        adminAcademyIds.includes(academyId)
      );

      if (!isAuthorized) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          'You do not have permission to access this user.'
        );
      }
    } else {
      if (loggedInUser.id !== id) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          'You do not have permission to access this user.'
        );
      }
    }
  }

  return user;
};

const updatePasswordHandler = async (data, loggedInUser) => {
  if (loggedInUser.id !== data.userId && loggedInUser.role !== 'SUPER_ADMIN') {
    return new ApiError(
      httpStatus.FORBIDDEN,
      'You do not have permission to update this password.'
    );
  }

  const user = await db.user.findUnique({
    where: { id: data.userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  const { currentPassword, newPassword } = data;

  const isMatch = await comparePassword(currentPassword, user.password);

  if (!isMatch) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Current password is incorrect.'
    );
  }

  const hashedNewPassword = await hashPassword(newPassword, 10);

  const updatedUser = await db.user.update({
    where: { id: data.userId },
    data: { password: hashedNewPassword },
  });

  return updatedUser;
};

const requestEmailChangeHandler = async (userId, newEmail, academyDomain) => {
  const existingUser = await db.user.findUnique({
    where: { email: newEmail },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, 'Email is already in use.');
  }

  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  await db.emailVerificationToken.deleteMany({
    where: {
      userId,
      newEmail,
    },
  });

  await db.emailVerificationToken.create({
    data: {
      userId,
      newEmail,
      token,
      expiresAt,
    },
  });

  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Chess in Chunks',
      link: academyDomain,
    },
  });

  const mailgenBody = {
    body: {
      name: 'User',
      intro: 'You requested to change your email address on Chess in Chunks.',
      action: {
        instructions:
          'Please use the following OTP to verify your new email address within 10 minutes:',
        button: {
          color: '#22BC66',
          text: `${token}`,
          link: academyDomain,
        },
      },
      outro:
        'If you did not request this, please ignore this email or contact our support.',
    },
  };

  const emailBody = mailGenerator.generate(mailgenBody);
  const emailText = mailGenerator.generatePlaintext(mailgenBody);

  await sendEmail({
    to: newEmail,
    subject: 'Verify Your New Email Address - Chess in Chunks',
    text: emailText,
    html: emailBody,
  });

  return { message: 'OTP has been sent to your new email address.' };
};

/**
 * Verify the OTP and change the user's email if valid.
 * @param {string} userId The ID of the logged-in user.
 * @param {string} token The OTP provided by the user.
 */
const verifyEmailChangeHandler = async (userId, token) => {
  const record = await db.emailVerificationToken.findFirst({
    where: {
      userId,
      token,
    },
  });

  if (!record) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Invalid OTP.');
  }

  if (record.expiresAt < new Date()) {
    await db.emailVerificationToken.delete({
      where: { id: record.id },
    });
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP has expired.');
  }

  await db.user.update({
    where: { id: userId },
    data: { email: record.newEmail },
  });

  await db.emailVerificationToken.delete({
    where: { id: record.id },
  });

  return { message: 'Email updated successfully.' };
};

const getProfileCompletionHandler = async (userId) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      role: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  // Define required fields for different roles
  const commonFields = [
    'email',
    'profile.firstName',
    'profile.lastName',
    'profile.phoneNumber',
    'profile.addressLine1',
    'profile.city',
    'profile.state',
    'profile.country',
  ];

  const studentFields = [
    ...commonFields,
    'profile.dateOfBirth',
    'profile.parentName',
    'profile.parentEmail',
    'profile.chessComId',
  ];

  const coachFields = [
    ...commonFields,
    'profile.dateOfBirth',
    'subRole',
    'profile.qualification',
    'profile.experience',
  ];

  // Select fields based on user role
  let requiredFields = commonFields;
  if (user.role.name === 'STUDENT') {
    requiredFields = studentFields;
  } else if (user.role.name === 'COACH') {
    requiredFields = coachFields;
  }

  // Count filled fields
  let filledFields = 0;
  for (const field of requiredFields) {
    const [parent, child] = field.includes('.')
      ? field.split('.')
      : [field, null];
    const value = child ? user[parent]?.[child] : user[parent];

    if (value !== null && value !== undefined && value !== '') {
      filledFields++;
    }
  }

  // Calculate percentage
  const completionPercentage = Math.round(
    (filledFields / requiredFields.length) * 100
  );

  return {
    completionPercentage,
    totalFields: requiredFields.length,
    filledFields,
    emptyFields: requiredFields.length - filledFields,
  };
};

const userService = {
  fetchAllUsersHandler,
  signUpSubscriberHandler,
  createUsersFromXlsx,
  updateUserStatus,
  updateUserHandler,
  fetchProfileById,
  updatePasswordHandler,
  requestEmailChangeHandler,
  verifyEmailChangeHandler,
  getProfileCompletionHandler,
};

module.exports = userService;
