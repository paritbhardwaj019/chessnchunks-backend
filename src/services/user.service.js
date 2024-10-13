const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const hashPassword = require('../utils/hashPassword');
const httpStatus = require('http-status');
const xlsx = require('xlsx');
const fs = require('fs');

const fetchAllUsersHandler = async (page, limit, query, loggedInUser) => {
  const numberPage = Number(page);
  const numberLimit = Number(limit);

  const user = await db.user.findUnique({
    where: {
      id: loggedInUser.id,
    },
    include: {
      adminOfAcademies: true,
    },
  });

  let allUsers = [];

  if (user.role === 'SUPER_ADMIN') {
    allUsers = await db.user.findMany({
      skip: (numberPage - 1) * numberLimit,
      take: numberLimit,
      where: {
        OR: [
          {
            email: {
              contains: query,
            },
          },
          {
            profile: {
              firstName: {
                contains: query,
              },
            },
          },
          {
            profile: {
              lastName: {
                contains: query,
              },
            },
          },
        ],
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
        createdAt: true,
        updatedAt: true,
      },
    });
  } else if (user.role === 'ADMIN') {
    const academyIDs = user.adminOfAcademies.map((el) => el.id);

    allUsers = await db.user.findMany({
      skip: (numberPage - 1) * numberLimit,
      take: numberLimit,
      where: {
        OR: [
          {
            adminOfAcademies: {
              some: {
                id: {
                  in: academyIDs,
                },
              },
            },
          },
          {
            studentOfBatches: {
              some: {
                academyId: {
                  in: academyIDs,
                },
              },
            },
          },
          {
            coachOfBatches: {
              some: {
                academyId: {
                  in: academyIDs,
                },
              },
            },
          },
        ],
        AND: [
          {
            OR: [
              { email: { contains: query } },
              { profile: { firstName: { contains: query } } },
              { profile: { lastName: { contains: query } } },
            ],
          },
        ],
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
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  return {
    allUsers,
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

  const user = await db.user.create({
    data: {
      email,
      password: hashedPassword,
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

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status },
  });

  return updatedUser;
};

const userService = {
  fetchAllUsersHandler,
  signUpSubscriberHandler,
  createUsersFromXlsx,
  updateUserStatus,
};

module.exports = userService;
