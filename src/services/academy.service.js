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

const academyService = {
  updateAcademyByIdHandler,
  fetchAcademyByIdHandler,
};

module.exports = academyService;
