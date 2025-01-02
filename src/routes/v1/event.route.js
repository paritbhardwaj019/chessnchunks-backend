const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const eventController = require('../../controllers/event.controller');
const checkPermission = require('../../middlewares/checkPermission');

const eventRouter = express.Router();

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

eventRouter
  .route('/:eventId')
  .put(checkJWT, eventController.editEventHandler)
  .delete(checkJWT, eventController.deleteEventHandler);

module.exports = eventRouter;
