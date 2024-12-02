const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const eventController = require('../../controllers/event.controller');
const checkPermission = require('../../middlewares/checkPermission');

const eventRouter = express.Router();

// // Get academy events
// router.get(
//   '/academy/:academyId',
//   authenticateUser,
//   eventController.getAcademyEvents
// );

// // Update an event
// router.put('/:eventId', authenticateUser, eventController.updateEvent);

// // Delete an event
// router.delete('/:eventId', authenticateUser, eventController.deleteEvent);

eventRouter
  .route('/')
  .post(
    checkJWT,
    checkPermission('add', '/dashboard/calendar'),
    eventController.createEventHandler
  )
  .get(
    checkJWT,
    checkPermission('view', '/dashboard/calendar'),
    eventController.fetchAcademyEventsHandler
  );

module.exports = eventRouter;
