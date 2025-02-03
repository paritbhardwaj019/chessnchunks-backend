const express = require('express');
const messageController = require('../controllers/message.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkRole = require('../../../middlewares/checkRole');
const ROLE_CONSTANT = require('../../../constants');

const messageRouter = express.Router();

messageRouter.post(
  '/broadcast',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    ROLE_CONSTANT.ROLE.ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
  ]),
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
