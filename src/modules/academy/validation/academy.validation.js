const ROLE_CONSTANT = require('../../../constants');
const db = require('../../../database/prisma');

const validateAcademyAccess = async (academyId, loggedInUser) => {
  try {
    if (!loggedInUser || !academyId) {
      return false;
    }

    if (loggedInUser.role === ROLE_CONSTANT.ROLE.SUPER_ADMIN) {
      return true;
    }

    if (loggedInUser.role === ROLE_CONSTANT.ROLE.ADMIN) {
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
      return Boolean(academy);
    }

    if (
      loggedInUser.role === ROLE_CONSTANT.ROLE.COACH &&
      loggedInUser.subRole === ROLE_CONSTANT.COACH_ROLE.HEAD_COACH
    ) {
      const coach = await db.user.findFirst({
        where: {
          id: loggedInUser.id,
          assignedToAcademyId: academyId,
          subRole: ROLE_CONSTANT.COACH_ROLE.HEAD_COACH,
        },
      });
      return Boolean(coach);
    }

    if (
      [ROLE_CONSTANT.ROLE.COACH, ROLE_CONSTANT.ROLE.STUDENT].includes(
        loggedInUser.role
      )
    ) {
      const user = await db.user.findFirst({
        where: {
          id: loggedInUser.id,
          assignedToAcademyId: academyId,
        },
      });
      return Boolean(user);
    }

    return false;
  } catch {
    return false;
  }
};

module.exports = validateAcademyAccess;
