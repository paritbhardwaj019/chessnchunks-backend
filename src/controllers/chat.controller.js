const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const chatService = require('../services/chat.service');
const { io } = require('../app');

const sendChatMessage = catchAsync(async (req, res) => {
  const senderId = req.user.id;
  const { receiverId, content } = req.body;

  const message = await chatService.sendChatMessage({ senderId, receiverId, content });

  // Emit the message to both users
  io.to(`user-${receiverId}`).emit('new_message', message);
  io.to(`user-${senderId}`).emit('new_message', message);

  res.status(httpStatus.OK).send(message);
});

const getChatMessages = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { conversationWith } = req.query;

  const messages = await chatService.getChatMessages(userId, conversationWith);

  res.status(httpStatus.OK).send(messages);
});

const chatController = {
  sendChatMessage,
  getChatMessages,
};

module.exports = chatController;
