const crypto = require('crypto');
const fs = require('fs');

const httpStatus = require('http-status');
const _ = require('lodash');
const Mailgen = require('mailgen');
const xlsx = require('xlsx');
const config = require('../../../config');
const db = require('../../../database/prisma');
const ApiError = require('../../../utils/apiError');
const { getDomainFromAdmin } = require('../../../utils/getDomainFromAdmin');
const sendMail = require('../../../utils/sendEmail');
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require('../../../utils/cloudinary.utils');
const comparePassword = require('../../../utils/comparePassword');
const createToken = require('../../../utils/createToken');
const formatNumberWithPrefix = require('../../../utils/formatNumberWithPrefix');
const hashPassword = require('../../../utils/hashPassword');
const {
  getSingleAcademyForUser,
} = require('../../academy/services/academy.service');
const {
  sendInvitationEmail,
  createStudentInvitation,
} = require('../../student/services/student.service');
const logger = require('../../../utils/logger');

const fetchAllUsersHandler = async (
  page,
  limit,
  query,
  roles,
  loggedInUser
) => {
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

  if (roles && roles.length > 0) {
    baseFilter.role = {
      name: { in: roles },
    };
  }

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
      orderBy: {
        createdAt: 'desc',
      },
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
      orderBy: {
        createdAt: 'desc',
      },
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
  if (!file?.path) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'File is missing!');
  }

  const user = await validateUser(loggedInUser);
  const academyId = user.adminOfAcademies[0].id;

  const ROLE_MAPPING = { 1: 'COACH', 2: 'STUDENT' };
  const COACH_SUB_ROLE_MAPPING = {
    1: 'HEAD_COACH',
    2: 'SENIOR_COACH',
    3: 'JUNIOR_COACH',
    4: 'PUZZLE_MASTER',
    5: 'PUZZLE_MASTER_SCHOLAR',
  };

  const workbook = xlsx.readFile(file.path);
  const jsonData = xlsx.utils.sheet_to_json(
    workbook.Sheets[workbook.SheetNames[0]]
  );

  const coachesCreated = [];
  const studentsCreated = [];
  const errors = [];
  const batches = _.chunk(jsonData, 10);

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (row) => {
        try {
          await processRow(
            row,
            academyId,
            loggedInUser,
            coachesCreated,
            studentsCreated,
            ROLE_MAPPING,
            COACH_SUB_ROLE_MAPPING
          );
        } catch (error) {
          errors.push(createErrorEntry(row, error));
        }
      })
    );
  }

  fs.unlinkSync(file.path);
  return { coachesCreated, studentsCreated, errors };
};

const validateUser = async (loggedInUser) => {
  const user = await db.user.findUnique({
    where: { id: loggedInUser.id },
    include: { adminOfAcademies: true, role: true },
  });

  if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'User not found.');
  if (user.role.name !== 'ADMIN')
    throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient permissions');
  if (!user.adminOfAcademies.length)
    throw new ApiError(httpStatus.BAD_REQUEST, 'No associated academy');

  return user;
};

const validateRowData = (row) => {
  const {
    'FIRST NAME': firstName,
    'LAST NAME': lastName,
    EMAIL: email,
    'PHONE NUMBER': phoneNumber,
    ROLE: roleNumber,
  } = row;
  if (!email || !firstName || !lastName || !phoneNumber || !roleNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
  }
  return { firstName, lastName, email, phoneNumber, roleNumber };
};

const processRow = async (
  row,
  academyId,
  loggedInUser,
  coachesCreated,
  studentsCreated,
  ROLE_MAPPING,
  COACH_SUB_ROLE_MAPPING
) => {
  const { email, roleNumber } = validateRowData(row);
  const role = ROLE_MAPPING[roleNumber];

  if (!role)
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid role: ${roleNumber}`);

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) throw new ApiError(httpStatus.CONFLICT, 'Email exists');

  const academy = await db.academy.findUnique({
    where: { id: academyId },
    select: { name: true, domain: true },
  });

  if (role === 'COACH') {
    await processCoach(
      row,
      academy,
      academyId,
      loggedInUser,
      COACH_SUB_ROLE_MAPPING,
      coachesCreated
    );
  } else {
    await processStudent(
      row,
      academy,
      academyId,
      loggedInUser,
      studentsCreated
    );
  }
};

const processCoach = async (
  row,
  academy,
  academyId,
  loggedInUser,
  COACH_SUB_ROLE_MAPPING,
  coachesCreated
) => {
  const {
    'FIRST NAME': firstName,
    'LAST NAME': lastName,
    EMAIL: email,
    'PHONE NUMBER': phoneNumber,
    SUB_ROLE: subRole,
  } = row;

  const tempPassword = crypto.randomBytes(8).toString('hex');
  const hashedPassword = await hashPassword(tempPassword, 10);

  const coachInvitation = await createCoachInvitation(
    firstName,
    lastName,
    email,
    phoneNumber,
    academyId,
    hashedPassword,
    COACH_SUB_ROLE_MAPPING[subRole],
    loggedInUser.id
  );

  const token = await createToken(
    { id: coachInvitation.id, version: coachInvitation.version },
    config.jwt.invitationSecret,
    '3d'
  );

  const baseUrl =
    COACH_SUB_ROLE_MAPPING[subRole] === 'HEAD_COACH'
      ? academy.domain
      : getDomainFromAdmin(academy.domain);

  const ACTIVATION_URL = `${baseUrl}/invitation?type=BATCH_COACH&name=${encodeURIComponent(
    `${firstName} ${lastName} from ${academy.name}`
  )}&token=${token}`;

  await sendCoachInvitationEmail(
    firstName,
    lastName,
    email,
    tempPassword,
    ACTIVATION_URL
  );
  coachesCreated.push({ email, firstName, lastName, role: 'COACH' });
};

const processStudent = async (
  row,
  academy,
  academyId,
  loggedInUser,
  studentsCreated
) => {
  const {
    'FIRST NAME': firstName,
    'LAST NAME': lastName,
    EMAIL: email,
    'PHONE NUMBER': phoneNumber,
  } = row;

  const tempPassword = crypto.randomBytes(8).toString('hex');
  const hashedPassword = await hashPassword(tempPassword, 10);

  try {
    const studentInvitation = await createStudentInvitation(
      { firstName, lastName, email, phoneNumber },
      academyId,
      hashedPassword,
      loggedInUser.id
    );

    const token = await createToken(
      { id: studentInvitation.id },
      config.jwt.invitationSecret,
      '3d'
    );

    const baseUrl = getDomainFromAdmin(academy.domain);

    const ACTIVATION_URL = `${baseUrl}/invitation?type=USER_INVITATION&name=${encodeURIComponent(
      `${firstName} ${lastName} from ${academy.name}`
    )}&token=${token}`;

    await sendInvitationEmail(
      email,
      firstName,
      lastName,
      academy.name,
      tempPassword,
      ACTIVATION_URL
    );

    studentsCreated.push({
      email,
      firstName,
      lastName,
      role: 'STUDENT',
      invitationId: studentInvitation.id,
    });
  } catch (error) {
    logger.error(`Failed to create student invitation: ${error.message}`);
    throw error;
  }
};

const createCoachInvitation = async (
  firstName,
  lastName,
  email,
  phoneNumber,
  academyId,
  hashedPassword,
  subRole,
  creatorId
) => {
  return await db.invitation.create({
    data: {
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        academyId,
        password: hashedPassword,
        subRole,
      },
      email,
      type: 'BATCH_COACH',
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      createdById: creatorId,
    },
  });
};

const createErrorEntry = (row, error) => ({
  email: row.EMAIL,
  firstName: row['FIRST NAME'],
  lastName: row['LAST NAME'],
  roleNumber: row.ROLE,
  error: error.message,
});

const sendCoachInvitationEmail = async (
  firstName,
  lastName,
  email,
  tempPassword,
  url
) => {
  const mailGenerator = new Mailgen({
    theme: 'default',
    product: { name: 'Chess in Chunks', link: config.frontendUrl },
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
          link: url,
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

  await sendMail(
    newEmail,
    'Verify Your New Email Address - Chess in Chunks',
    emailText,
    emailBody
  );

  return { message: 'OTP has been sent to your new email address.' };
};

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

const updateProfileHandler = async (id, data, loggedInUser) => {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      profile: true,
      role: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Only allow users to update their own profile unless they're a super admin
  if (loggedInUser.id !== id && loggedInUser.role !== 'SUPER_ADMIN') {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You do not have permission to update this profile'
    );
  }

  // Handle file upload if there's a profile image
  let imageUrl = null;
  if (data.profileImage) {
    try {
      const uploadResult = await uploadToCloudinary(data.profileImage.path, {
        folder: 'profile-images',
        publicId: `profile-${id}-${Date.now()}`,
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif'],
        maxSize: 5 * 1024 * 1024, // 5MB max size
      });
      imageUrl = uploadResult.url;

      // Delete old profile image if it exists
      if (user.profile?.imageUrl) {
        const oldImagePublicId = user.profile.imageUrl
          .split('/')
          .slice(-1)[0]
          .split('.')[0];
        if (oldImagePublicId) {
          await deleteFromCloudinary(oldImagePublicId);
        }
      }
    } catch (error) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Profile image upload failed - ${error.message}`
      );
    } finally {
      // Clean up the temporary file
      if (data.profileImage.path) {
        fs.unlinkSync(data.profileImage.path);
      }
    }
  }

  // Extract profile-specific fields
  const {
    firstName,
    lastName,
    middleName,
    dateOfBirth,
    phoneNumber,
    addressLine1,
    addressLine2,
    city,
    state,
    country,
    zipcode,
    parentName,
    parentEmail,
    chessComId,
    lichessId,
    uscfId,
    status,
  } = data;

  // Validate chess.com ID if provided
  if (chessComId) {
    const existingUserWithChessComId = await db.profile.findFirst({
      where: {
        chessComId,
        NOT: {
          userId: id,
        },
      },
    });

    if (existingUserWithChessComId) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'Chess.com ID is already associated with another user'
      );
    }
  }

  const profileUpdateData = {
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(middleName && { middleName }),
    ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
    ...(phoneNumber && { phoneNumber }),
    ...(addressLine1 && { addressLine1 }),
    ...(addressLine2 && { addressLine2 }),
    ...(city && { city }),
    ...(state && { state }),
    ...(country && { country }),
    ...(zipcode && { zipcode }),
    ...(parentName && { parentName }),
    ...(parentEmail && { parentEmail }),
    ...(chessComId && { chessComId }),
    ...(lichessId && { lichessId }),
    ...(uscfId && { uscfId }),
    ...(imageUrl && { imageUrl }),
  };

  const userUpdateData = {
    ...(status && { status }),
  };

  try {
    if (user.profile) {
      await db.profile.update({
        where: { userId: id },
        data: profileUpdateData,
      });
    } else {
      await db.profile.create({
        data: {
          ...profileUpdateData,
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });
    }

    if (Object.keys(userUpdateData).length > 0) {
      await db.user.update({
        where: { id },
        data: userUpdateData,
      });
    }

    const updatedUser = await db.user.findUnique({
      where: { id },
      include: {
        profile: true,
        role: true,
      },
    });

    return updatedUser;
  } catch (error) {
    if (imageUrl) {
      try {
        const newImagePublicId = imageUrl.split('/').slice(-1)[0].split('.')[0];
        await deleteFromCloudinary(newImagePublicId);
      } catch (cleanupError) {
        logger.error(`Failed to clean up Cloudinary image: ${cleanupError}`);
      }
    }
    throw error;
  }
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
  updateProfileHandler,
};

module.exports = userService;
