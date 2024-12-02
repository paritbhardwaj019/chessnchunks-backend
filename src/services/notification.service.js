const db = require('../database/prisma');

const createEventNotificationHandler = async (data, loggedInUser) => {
  const academyUsers = await db.user.findMany({
    where: {
      AND: [
        {
          OR: [
            { adminOfAcademies: { some: { id: data.academy.id } } },
            { studentOfBatches: { some: { academyId: data.academy.id } } },
            { coachOfBatches: { some: { academyId: data.academy.id } } },
          ],
        },
        {
          id: { not: loggedInUser.id },
        },
      ],
    },
  });

  const createdNotifications = await Promise.all(
    academyUsers.map((user) =>
      db.notification.create({
        data: {
          message: `New event: ${data.title}`,
          user: { connect: { id: user.id } },
          event: { connect: { id: data.id } },
          academy: { connect: { id: data.academy.id } },
          isRead: false,
        },
      })
    )
  );

  return createdNotifications;
};

const fetchAllNotificationsHandler = async (loggedInUser) => {
  return db.notification.findMany({
    where: {
      user: {
        id: loggedInUser.id,
      },
    },
    include: {
      event: true,
      academy: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

const markAsReadHandler = async (id) => {
  return db.notification.update({
    where: { id: id },
    data: { isRead: true },
  });
};

const markAllAsReadHandler = async (loggedInUser) => {
  return db.notification.updateMany({
    where: {
      user: {
        id: loggedInUser.id,
      },
      isRead: false,
    },
    data: { isRead: true },
  });
};

const notificationService = {
  createEventNotificationHandler,
  fetchAllNotificationsHandler,
  markAsReadHandler,
  markAllAsReadHandler,
};

module.exports = notificationService;
