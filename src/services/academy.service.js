const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');

const updateAcademyByIdHandler = async (data, id, loggedInUser) => {
  console.log(data, id, loggedInUser);

  if (loggedInUser.role === 'SUPER_ADMIN') {
    const updatedAcademy = await db.academy.update({
      where: {
        id,
      },
      data,
    });

    return {
      updatedAcademy,
    };
  } else if (loggedInUser.role === 'ADMIN') {
    const hasAccess = await db.academy.findFirst({
      where: {
        id,
        admins: {
          some: {
            id: loggedInUser.id,
          },
        },
      },
      select: {
        admins: true,
        id: true,
      },
    });

    if (!hasAccess)
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "User isn't authorized to perform this action"
      );

    const updatedAcademy = await db.academy.update({
      where: {
        id,
      },
      data,
    });

    return {
      updatedAcademy,
    };
  }
};

const fetchAcademyByIdHandler = async (id, loggedInUser) => {
  if (loggedInUser.role === 'SUPER_ADMIN') {
    const academy = await db.academy.findUnique({
      where: { id },
      include: {
        admins: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            email: true,
          },
        },
        batches: {
          include: {
            students: {
              select: { id: true },
            },
            coaches: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!academy) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Academy not found');
    }

    const totalStudents = academy.batches.reduce(
      (acc, batch) => acc + batch.students.length,
      0
    );
    const totalCoaches = academy.batches.reduce(
      (acc, batch) => acc + batch.coaches.length,
      0
    );

    return {
      academy: {
        name: academy.name,
        fullName: academy.admins.map(
          (admin) => `${admin.profile?.firstName} ${admin.profile?.lastName}`
        ),
        email: academy.admins.map((admin) => admin.email),
        students: totalStudents,
        coaches: totalCoaches,
        batches: academy.batches.length,
        status: academy.status,
        createdAt: academy.createdAt,
      },
    };
  } else if (loggedInUser.role === 'ADMIN') {
    const academy = await db.academy.findFirst({
      where: {
        id,
        admins: {
          some: {
            id: loggedInUser.id,
          },
        },
      },
    });

    if (!academy)
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "User isn't authorized to perform this action"
      );

    return {
      academy,
    };
  }
};

const getSingleAcademyForUser = async (loggedInUser) => {
  const user = await db.user.findUnique({
    where: { id: loggedInUser.id },
    include: {
      adminOfAcademies: true,
      coachOfBatches: {
        include: {
          academy: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  let academyIds = [];

  if (user.role === 'ADMIN') {
    academyIds = user.adminOfAcademies.map((academy) => academy.id);
  } else if (user.role === 'COACH') {
    academyIds = user.coachOfBatches.map((batch) => batch.academyId);
  } else {
    logger.error(`Unsupported role "${user.role}" for user id: ${userId}`);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Role "${user.role}" is not authorized to perform this action.`
    );
  }

  academyIds = [...new Set(academyIds)];

  if (academyIds.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `${user.role} is not associated with any academy.`
    );
  }

  if (academyIds.length > 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `${user.role} is associated with multiple academies. Please specify the academy.`
    );
  }

  const academy = await db.academy.findUnique({
    where: { id: academyIds[0] },
  });

  if (!academy) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Academy not found.');
  }

  return academy;
};

const academyService = {
  updateAcademyByIdHandler,
  fetchAcademyByIdHandler,
  getSingleAcademyForUser,
};

module.exports = academyService;
