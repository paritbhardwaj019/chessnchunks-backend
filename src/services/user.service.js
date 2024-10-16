const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const hashPassword = require('../utils/hashPassword');
const httpStatus = require('http-status');
const xlsx = require('xlsx');
const fs = require('fs');
const formatNumberWithPrefix = require('../utils/formatNumberWithPrefix');

const fetchAllUsersHandler = async (page, limit, query, loggedInUser) => {
  // Parse and set default pagination parameters
  const numberPage = Number(page) || 1;
  const numberLimit = Number(limit) || 10;
  const skip = (numberPage - 1) * numberLimit;
  const take = numberLimit;

  const user = await db.user.findUnique({
    where: { id: loggedInUser.id },
    include: {
      adminOfAcademies: true,
      coachOfBatches: true,
    },
  });

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
    role: true,
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
  };

  let allUsers = [];

  if (user.role === 'SUPER_ADMIN') {
    allUsers = await db.user.findMany({
      skip,
      take,
      where: baseFilter,
      select: selectFields,
    });
  } else if (user.role === 'ADMIN') {
    const academyIDs = user.adminOfAcademies.map((academy) => academy.id);

    allUsers = await db.user.findMany({
      skip,
      take,
      where: {
        ...baseFilter,
        AND: [
          {
            OR: [
              { adminOfAcademies: { some: { id: { in: academyIDs } } } },
              { studentOfBatches: { some: { academyId: { in: academyIDs } } } },
              { coachOfBatches: { some: { academyId: { in: academyIDs } } } },
            ],
          },
        ],
      },
      select: selectFields,
    });
  } else if (user.role === 'COACH') {
    const batchIDs = user.coachOfBatches.map((batch) => batch.id);

    if (batchIDs.length === 0) {
      allUsers = [];
    } else {
      const studentFilter = {
        role: 'STUDENT',
        studentOfBatches: { some: { id: { in: batchIDs } } },
      };

      const orConditions = [studentFilter];

      if (user.subRole === 'HEAD_COACH') {
        const coachFilter = {
          role: 'COACH',
          subRole: { not: 'HEAD_COACH' },
          coachOfBatches: { some: { id: { in: batchIDs } } },
        };
        orConditions.push(coachFilter);
      }

      const whereCondition = {
        ...baseFilter,
        AND: [
          {
            OR: orConditions,
          },
        ],
      };

      allUsers = await db.user.findMany({
        skip,
        take,
        where: whereCondition,
        select: selectFields,
      });
    }
  } else {
    allUsers = [];
  }

  return {
    allUsers,
    total: allUsers.length,
  };
};
const signUpSubscriberHandler = async (data) => {
  const {
    email,
    password,
    firstName,
    lastName,
    dob,
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

  const newDOB = new Date(dob);

  const profile = await db.profile.create({
    data: {
      firstName,
      lastName,
      dob: newDOB,
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

  const user = await db.user.create({
    data: {
      email,
      password: hashedPassword,
      code: newCode,
      role: 'SUBSCRIBER',
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
    },
  });

  if (!user || user.adminOfAcademies.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'User is not associated with any academy.'
    );
  }

  const academyId = user.adminOfAcademies[0].id;

  const ROLE_MAPPING = {
    1: 'COACH',
    2: 'STUDENT',
  };

  const COACH_ROLE_MAPPING = {
    1: 'HEAD_COACH',
    2: 'SENIOR_COACH',
    3: 'JUNIOR_COACH',
    4: 'PUZZLE_MASTER',
    5: 'PUZZLE_MASTER_SCHOLAR',
  };

  const validRoles = ['COACH', 'STUDENT'];
  const validSubRoles = [
    'HEAD_COACH',
    'SENIOR_COACH',
    'JUNIOR_COACH',
    'PUZZLE_MASTER',
    'PUZZLE_MASTER_SCHOLAR',
  ];

  const workbook = xlsx.readFile(file.path);
  const sheetNames = workbook.SheetNames;

  const usersCreated = [];
  const errors = [];

  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    for (const row of jsonData) {
      const firstName = row['FIRST NAME'];
      const lastName = row['LAST NAME'];
      const email = row['EMAIL'];
      const roleNumber = row['ROLE'];
      const subRoleNumber = row['SUB_ROLE'];
      const batchCode = row['BATCH CODE'];

      try {
        if (
          !email ||
          !firstName ||
          !lastName ||
          roleNumber === undefined ||
          !batchCode
        ) {
          throw new Error('Missing required fields');
        }

        const role = ROLE_MAPPING[roleNumber];
        if (!role) {
          throw new Error(`Invalid role number: ${roleNumber}`);
        }

        if (!validRoles.includes(role)) {
          throw new Error(`Invalid role: ${role}`);
        }

        let subRole = null;
        if (role === 'COACH') {
          if (subRoleNumber === undefined) {
            throw new Error('SubRole is required for role COACH');
          }
          subRole = COACH_ROLE_MAPPING[subRoleNumber];
          if (!subRole) {
            throw new Error(`Invalid subRole number: ${subRoleNumber}`);
          }
          if (!validSubRoles.includes(subRole)) {
            throw new Error(`Invalid subRole: ${subRole}`);
          }
        }

        const batch = await db.batch.findFirst({
          where: {
            batchCode: batchCode,
            academyId: academyId,
          },
        });

        if (!batch) {
          throw new Error(
            `Batch with code ${batchCode} not found for your academy.`
          );
        }

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

        const userData = {
          email,
          role,
          subRole,
          profile: {
            create: {
              firstName,
              lastName,
            },
          },
          code: newCode,
        };

        if (role === 'COACH') {
          userData.coachOfBatches = {
            connect: {
              id: batch.id,
            },
          };
        } else if (role === 'STUDENT') {
          userData.studentOfBatches = {
            connect: {
              id: batch.id,
            },
          };
        }

        const newUser = await db.user.create({
          data: userData,
        });

        usersCreated.push({
          email,
          firstName,
          lastName,
          role,
          subRole,
          batchCode,
        });
      } catch (error) {
        console.error(error);
        errors.push({
          email,
          firstName,
          lastName,
          roleNumber,
          subRoleNumber,
          batchCode,
          error: error.message,
        });
      }
    }
  }

  fs.unlinkSync(file.path);

  return {
    usersCreated,
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

  // Fetch the user to be updated
  const user = await db.user.findUnique({
    where: { id },
    include: { profile: true, coachOfBatches: true, studentOfBatches: true },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  // Authorization: Only SUPER_ADMIN or ADMIN can update users
  if (loggedInUser.role !== 'SUPER_ADMIN') {
    if (loggedInUser.role === 'ADMIN') {
      // Check if the user belongs to any academy managed by the ADMIN
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
    updateData.role = role;
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

  // Perform the update
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

const userService = {
  fetchAllUsersHandler,
  signUpSubscriberHandler,
  createUsersFromXlsx,
  updateUserStatus,
  updateUserHandler,
  fetchProfileById,
};

module.exports = userService;
