const db = require('../../../database/prisma');
const {
  getSingleAcademyForUser,
} = require('../../academy/services/academy.service');
const notificationService = require('../../notification/services/notification.service');

/**
 * Creates a new event.
 * @param {Object} data - The event data.
 * @param {Object} loggedInUser - The currently logged-in user.
 */
const createEventHandler = async (data, loggedInUser) => {
  const academy = await getSingleAcademyForUser(loggedInUser);

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

  return createdEvent;
};

/**
 * Retrieves all events for the user's academy.
 * @param {Object} loggedInUser - The currently logged-in user.
 */
const getAcademyEventsHandler = async (loggedInUser) => {
  const academy = await getSingleAcademyForUser(loggedInUser);

  'academy', academy;

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

/**
 * Deletes an event by ID.
 * @param {string} id - The ID of the event to delete.
 */
const deleteEventHandler = async (id) => {
  return db.event.delete({
    where: { id: id },
  });
};

/**
 * Edits an existing event.
 * @param {string} id - The ID of the event to edit.
 * @param {Object} data - The updated event data.
 * @param {Object} loggedInUser - The currently logged-in user.
 */
const editEventHandler = async (id, data) => {
  const existingEvent = await db.event.findUnique({
    where: { id: id },
    include: { academy: true, createdBy: true },
  });

  if (!existingEvent) {
    throw new Error('Event not found');
  }

  const updatedEvent = await db.event.update({
    where: { id: id },
    data: {
      title: data.title !== undefined ? data.title : existingEvent.title,
      description:
        data.description !== undefined
          ? data.description
          : existingEvent.description,
      startDate:
        data.startDate !== undefined ? data.startDate : existingEvent.startDate,
      endDate:
        data.endDate !== undefined ? data.endDate : existingEvent.endDate,
    },
    include: {
      academy: true,
      createdBy: true,
    },
  });

  return updatedEvent;
};

const eventService = {
  createEventHandler,
  getAcademyEventsHandler,
  deleteEventHandler,
  editEventHandler,
};

module.exports = eventService;
