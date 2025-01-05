const db = require('../database/prisma');

const getCurrentSubscription = async (loggedInUser) => {
  const platformSubscription = await db.subscription.findFirst({
    where: {
      user: {
        id: loggedInUser.id,
      },
      academyId: null,
    },
    include: {
      plan: true,
    },
  });

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
