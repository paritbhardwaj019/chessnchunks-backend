const httpStatus = require('http-status');
const ApiError = require('../../../utils/apiError');

const validateHeadCoach = async (db, coaches) => {
  if (!coaches || coaches.length < 1) return;

  const headCoaches = await db.user.findMany({
    where: {
      id: { in: coaches },
      role: { name: 'COACH' },
      subRole: 'HEAD_COACH',
    },
    select: { id: true },
  });

  if (headCoaches.length > 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'A batch can have only one HEAD_COACH.'
    );
  }
};

const validateBatchCapacity = (currentStudents, newCapacity, students) => {
  const studentCount = students ? students.length : currentStudents;

  if (studentCount > newCapacity) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Number of students (${studentCount}) exceeds the maximum capacity (${newCapacity}).`
    );
  }
};

const validateUserAcademy = async (db, userId, role) => {
  const userWithAcademies = await db.user.findUnique({
    where: { id: userId },
    include: {
      adminOfAcademies: true,
      coachOfBatches: {
        include: { academy: true },
      },
    },
  });

  const academyIds =
    role === 'COACH'
      ? userWithAcademies.coachOfBatches.map((batch) => batch.academyId)
      : userWithAcademies.adminOfAcademies.map((academy) => academy.id);

  const uniqueAcademyIds = [...new Set(academyIds)];

  if (uniqueAcademyIds.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `${role} is not associated with any academy.`
    );
  }

  if (uniqueAcademyIds.length > 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `${role} is associated with multiple academies. Please specify the academy.`
    );
  }

  return uniqueAcademyIds[0];
};

module.exports = {
  validateHeadCoach,
  validateBatchCapacity,
  validateUserAcademy,
};
