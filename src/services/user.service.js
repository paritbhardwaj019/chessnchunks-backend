const db = require('../database/prisma');

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

const userService = {
  fetchAllUsersHandler,
};

module.exports = userService;
