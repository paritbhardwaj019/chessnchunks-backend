const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');

const updateAcademyByIdHandler = async (data, id, loggedInUser) => {
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
      where: {
        id,
      },
    });

    return {
      academy,
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

const academyService = {
  updateAcademyByIdHandler,
  fetchAcademyByIdHandler,
};

module.exports = academyService;
