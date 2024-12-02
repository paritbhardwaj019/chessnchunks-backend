const db = require('../database/prisma');
const { getSingleAcademyForUser } = require('./academy.service');
const notificationService = require('./notification.service');

const createEventHandler = async (data, loggedInUser) => {
  const academy = await getSingleAcademyForUser(loggedInUser);

  console.log(data);

  const createdEvent = await db.event.create({
    data: {
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      createdBy: { connect: { id: loggedInUser.id } },
      academy: { connect: { id: academy.id } },
    },
    include: {
      academy: true,
    },
  });

  await notificationService.createEventNotificationHandler(
    createdEvent,
    loggedInUser
  );
};

const getAcademyEventsHandler = async (loggedInUser) => {
  const academy = await getSingleAcademyForUser(loggedInUser);

  return db.event.findMany({
    where: {
      academy: {
        id: academy.id,
      },
    },
    include: {
      createdBy: true,
    },
    orderBy: { startDate: 'desc' },
  });
};

const deleteEventHandler = async (id) => {
  return db.event.delete({
    where: { id: id },
  });
};

const eventService = {
  createEventHandler,
  getAcademyEventsHandler,
  deleteEventHandler,
};

module.exports = eventService;
