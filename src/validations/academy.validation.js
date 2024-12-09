const db = require('../database/prisma');

const validateAcademyAccess = async (academyId, loggedInUser) => {
  try {
    if (!loggedInUser || !academyId) {
      return false;
    }

    if (loggedInUser.role === 'SUPER_ADMIN') {
      return true;
    }

    if (loggedInUser.role === 'ADMIN') {
      const academy = await db.academy.findFirst({
        where: {
          id: academyId,
          admins: {
            some: {
              id: loggedInUser.id,
            },
          },
        },
      });
      return !!academy;
    }

    if (
      loggedInUser.role === 'COACH' &&
      loggedInUser.subRole === 'HEAD_COACH'
    ) {
      const coach = await db.user.findFirst({
        where: {
          id: loggedInUser.id,
          assignedToAcademyId: academyId,
          subRole: 'HEAD_COACH',
        },
      });
      return !!coach;
    }

    if (['COACH', 'STUDENT'].includes(loggedInUser.role)) {
      const user = await db.user.findFirst({
        where: {
          id: loggedInUser.id,
          assignedToAcademyId: academyId,
        },
      });
      return !!user;
    }

    return false;
  } catch {
    return false;
  }
};

module.exports = validateAcademyAccess;
