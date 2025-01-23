const db = require('../../../database/prisma');

const getCurrentSubscription = async (loggedInUser) => {
  const student = await db.user.findUnique({
    where: {
      id: loggedInUser.id,
    },
    include: {
      assignedToAcademy: {
        include: {
          admins: {
            where: {
              adminRole: 'ACADEMY_ADMIN',
            },
            take: 1,
          },
        },
      },
    },
  });

  let platformSubscription = null;

  student;

  if (student?.assignedToAcademy) {
    platformSubscription = await db.subscription.findFirst({
      where: {
        academy: {
          id: student?.assignedToAcademy?.id,
        },
      },
      include: {
        plan: true,
      },
    });
  }

  'PLATFORM SUBSCRIPTION', platformSubscription;

  const academySubscription = await db.studentSubscription.findFirst({
    where: {
      user: {
        id: loggedInUser.id,
      },
      status: 'ACTIVE',
    },
    include: {
      academyPlan: true,
    },
  });

  return { platformSubscription, academySubscription };
};

const studentProfileService = {
  getCurrentSubscription,
};

module.exports = studentProfileService;
