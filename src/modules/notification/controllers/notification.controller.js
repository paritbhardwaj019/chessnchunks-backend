const httpStatus = require('http-status');
const notificationService = require('../services/notification.service');
const catchAsync = require('../../../utils/catchAsync');

const fetchAllNotificationsHandler = catchAsync(async (req, res) => {
  const allNotifications =
    await notificationService.fetchAllNotificationsHandler(req.user);

  res.status(httpStatus.OK).send(allNotifications);
});

const markAllAsReadHandler = catchAsync(async (req, res) => {
  const updatedNotifications = await notificationService.markAllAsReadHandler(
    req.user
  );
  res.status(httpStatus.OK).send(updatedNotifications);
});

const notificationController = {
  fetchAllNotificationsHandler,
  markAllAsReadHandler,
};

module.exports = notificationController;
