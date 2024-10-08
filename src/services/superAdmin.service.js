const httpStatus = require('http-status');
const config = require('../config');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const createToken = require('../utils/createToken');
const decodeToken = require('../utils/decodeToken');
const logger = require('../utils/logger');

const inviteAcademyAdminHandler = async (data) => {
  const { firstName, lastName, email, academyName } = data;

  const academyAdminInvitation = await db.invitation.create({
    data: {
      data: {
        firstName,
        lastName,
        academyName,
        email,
      },
      email,
      type: 'CREATE_ACADEMY',
    },
    select: {
      id: true,
      email: true,
      type: true,
      status: true,
      data: true,
    },
  });

  const token = await createToken(
    {
      id: academyAdminInvitation.id,
    },
    config.jwt.invitationSecret,
    '3d'
  );

  logger.info(token);

  return academyAdminInvitation;
};

const verifyAcademyAdminHandler = async (token) => {
  if (!token) {
    throw new ApiError('Token not present!', httpStatus.BAD_REQUEST);
  }

  const data = await decodeToken(token, config.jwt.invitationSecret);

  const academyAdminInvitation = await db.invitation.findUnique({
    where: {
      id: data.id,
    },
    select: {
      id: true,
      data: true,
      type: true,
      status: true,
    },
  });

  if (academyAdminInvitation.type !== 'CREATE_ACADEMY') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token');
  }

  if (academyAdminInvitation.status === 'ACCEPTED') {
    throw new ApiError(
      httpStatus.ALREADY_REPORTED,
      'Invitation already accepted!'
    );
  }

  const { firstName, lastName, email, academyName } =
    academyAdminInvitation.data;

  const academyAdminProfile = await db.profile.create({
    data: {
      firstName,
      lastName,
    },
    select: {
      id: true,
    },
  });

  const academyAdmin = await db.user.create({
    data: {
      email,
      profile: {
        connect: {
          id: academyAdminProfile.id,
        },
      },
      role: 'ADMIN',
    },
    select: {
      id: true,
      email: true,
    },
  });

  const newAcademy = await db.academy.create({
    data: {
      name: academyName,
      admins: {
        connect: [
          {
            id: academyAdmin.id,
          },
        ],
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  await db.user.update({
    where: {
      id: academyAdmin.id,
    },
    data: {
      adminOfAcademies: {
        connect: [{ id: newAcademy.id }],
      },
    },
  });

  await db.invitation.delete({
    where: {
      id: academyAdminInvitation.id,
    },
  });

  return {
    newAcademy,
    academyAdmin,
  };
};

const fetchAllAdminsByAcademyId = async (page, limit, academyId) => {
  const allAdmins = await db.user.findMany({
    where: {
      adminOfAcademies: {
        some: {
          id: academyId,
        },
      },
    },
    include: {
      profile: true,
    },
  });

  return allAdmins;
};

const fetchAllInvitationsHandler = async (page, limit, type) => {
  const allInvitations = await db.invitation.findMany({
    where: {
      type,
    },
    select: {
      id: true,
      type: true,
      email: true,
      data: true,
      status: true,
    },
  });

  return allInvitations;
};

const fetchAllAcademiesHandler = async (page, limit) => {
  const allAcademies = await db.academy.findMany({
    select: {
      id: true,
      name: true,
      batches: {
        select: {
          id: true,
          batchId: true,
        },
      },
    },
  });
  return allAcademies;
};

const fetchAllUsersHandler = async (page = 1, limit = 10, query = '', loggedInUser) => {
  const numberPage = Math.max(1, Number(page));
  const numberLimit = Math.max(1, Number(limit));
  const searchQuery = query || '';  // Default to an empty string if query is undefined or null

  console.log('Request Parameters:', { page, limit, query, loggedInUser });

  const user = await db.user.findUnique({
    where: {
      id: loggedInUser.id,
    },
    include: {
      adminOfAcademies: true,
    },
  });

  if (!user) {
    console.error('User not found:', loggedInUser.id);
    return { allUsers: [] };
  }

  console.log('Logged In User:', user);

  let allUsers = [];

  // Only include valid search filters (i.e., skip undefined or empty values)
  const searchFilters = [
    query ? { email: { contains: searchQuery } } : null,
    query ? { profile: { firstName: { contains: searchQuery } } } : null,
    query ? { profile: { lastName: { contains: searchQuery } } } : null,
  ].filter(Boolean);  // Remove null values from the filters

  console.log('Search Filters:', searchFilters);

  if (user.role === 'SUPER_ADMIN') {
    allUsers = await db.user.findMany({
      skip: (numberPage - 1) * numberLimit,
      take: numberLimit,
      where: {
        OR: searchFilters,  // Only include valid search filters
      },
      select: {
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
  } else if (user.role === 'ADMIN') {
    const academyIDs = user.adminOfAcademies.map((el) => el.id);
    console.log('Academy IDs for Admin:', academyIDs);

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
        AND: searchFilters,  // Apply search filters in the AND clause
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
  }

  console.log('Fetched Users:', allUsers);

  return {
    allUsers,
  };
};

const superAdminService = {
  inviteAcademyAdminHandler,
  verifyAcademyAdminHandler,
  fetchAllAdminsByAcademyId,
  fetchAllInvitationsHandler,
  fetchAllAcademiesHandler,
  fetchAllUsersHandler,
};

module.exports = superAdminService;
