const express = require('express');
const notificationController = require('../../controllers/notification.controller');
const checkJWT = require('../../middlewares/checkJWT');

const notificationRouter = express.Router();

notificationRouter.put(
  '/mark-all-read',
  checkJWT,
  notificationController.markAllAsReadHandler
);

notificationRouter
  .route('/')
  .get(checkJWT, notificationController.fetchAllNotificationsHandler);

module.exports = notificationRouter;
