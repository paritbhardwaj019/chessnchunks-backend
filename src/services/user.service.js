const db = require('../database/prisma');
const hashPassword = require('../utils/hashPassword');

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

  const result = await db.$transaction(async (prisma) => {
    const profile = await prisma.profile.create({
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

    return { user, subscription };
  });

  return result;
};
const userService = {
  fetchAllUsersHandler,
  signUpSubscriberHandler,
};

module.exports = userService;
