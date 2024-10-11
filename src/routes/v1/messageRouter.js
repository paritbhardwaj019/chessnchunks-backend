const express = require('express');
const messageController = require('../../controllers/message.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');

const messageRouter = express.Router();

// Coach sends a broadcast message
messageRouter.post(
  '/broadcast',
  checkJWT,
  checkRole(['COACH']),
  messageController.sendBroadcastMessage
);

// Send a message to another user
messageRouter.post(
  '/',
  checkJWT,
  messageController.sendMessage
);

// Get messages in a conversation
messageRouter.get(
  '/',
  checkJWT,
  messageController.getMessages
);

// Mark messages as read
messageRouter.post(
  '/read',
  checkJWT,
  messageController.markMessagesAsRead
);

module.exports = messageRouter;
