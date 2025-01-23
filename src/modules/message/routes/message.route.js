const express = require('express');
const messageController = require('../controllers/message.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkRole = require('../../../middlewares/checkRole');

const messageRouter = express.Router();

messageRouter.post(
  '/broadcast',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  messageController.sendBroadcastMessage
);

messageRouter.post('/', checkJWT, messageController.sendMessage);

messageRouter.get('/', checkJWT, messageController.getMessages);

messageRouter.post('/read', checkJWT, messageController.markMessagesAsRead);

messageRouter.get(
  '/conversations',
  checkJWT,
  messageController.getConversations
);

module.exports = messageRouter;
