const express = require('express');
const chatController = require('../../controllers/chat.controller');
const checkJWT = require('../../middlewares/checkJWT');

const chatRouter = express.Router();

// Send a chat message to another student in the same batch
chatRouter.post(
  '/',
  checkJWT,
  chatController.sendChatMessage
);

// Get chat messages between two students
chatRouter.get(
  '/',
  checkJWT,
  chatController.getChatMessages
);

module.exports = chatRouter;
