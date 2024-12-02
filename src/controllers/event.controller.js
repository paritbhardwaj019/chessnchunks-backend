const httpStatus = require('http-status');
const eventService = require('../services/event.service');
const catchAsync = require('../utils/catchAsync');

const createEventHandler = catchAsync(async (req, res) => {
  const createdEvent = await eventService.createEventHandler(
    req.body,
    req.user
  );
  res.status(httpStatus.OK).send(createdEvent);
});

const fetchAcademyEventsHandler = catchAsync(async (req, res) => {
  const allEvents = await eventService.getAcademyEventsHandler(req.user);
  res.status(httpStatus.OK).send(allEvents);
});

const eventController = { createEventHandler, fetchAcademyEventsHandler };

module.exports = eventController;
