const httpStatus = require('http-status');
const eventService = require('../services/event.service');
const catchAsync = require('../utils/catchAsync');

/**
 * Creates a new event.
 */
const createEventHandler = catchAsync(async (req, res) => {
  const createdEvent = await eventService.createEventHandler(
    req.body,
    req.user
  );
  res.status(httpStatus.OK).send(createdEvent);
});

/**
 * Retrieves all events for the user's academy.
 */
const fetchAcademyEventsHandler = catchAsync(async (req, res) => {
  const allEvents = await eventService.getAcademyEventsHandler(req.user);
  res.status(httpStatus.OK).send(allEvents);
});

/**
 * Edits an existing event.
 */
const editEventHandler = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const updatedData = req.body;
  const loggedInUser = req.user;

  const updatedEvent = await eventService.editEventHandler(
    eventId,
    updatedData,
    loggedInUser
  );

  res.status(httpStatus.OK).send(updatedEvent);
});

const deleteEventHandler = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  await eventService.deleteEventHandler(eventId);

  res.status(httpStatus.NO_CONTENT).send();
});

const eventController = {
  createEventHandler,
  fetchAcademyEventsHandler,
  editEventHandler,
  deleteEventHandler,
};

module.exports = eventController;
