const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const messageService = require('../services/message.service');
const logger = require('../utils/logger'); // Add logger

// Coach sends a broadcast message to students in a batch
const sendBroadcastMessage = catchAsync(async (req, res) => {
  const { batchId, studentIds, content, isEmail } = req.body;
  const senderId = req.user.id; // Assuming req.user is populated with authenticated user

  logger.info(`Coach: ${senderId} sending broadcast message to batch: ${batchId}`);

  const result = await messageService.sendBroadcastMessage({
    senderId,
    batchId,
    studentIds,
    content,
    isEmail,
  });

  logger.info(`Broadcast message sent by Coach: ${senderId} to batch: ${batchId}`);

  res.status(httpStatus.OK).send({ message: 'Messages sent successfully' });
});

// Send a message to another user (e.g., friend or batchmate)
const sendMessage = catchAsync(async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user.id;

  logger.info(`User: ${senderId} sending message to User: ${receiverId}`);

  const message = await messageService.sendMessage({
    senderId,
    receiverId,
    content,
  });

  res.status(httpStatus.OK).send(message);
});

// Get messages between the current user and another user
const getMessages = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { conversationWith } = req.query;

  logger.info(`User: ${userId} fetching messages with User: ${conversationWith}`);

  const messages = await messageService.getMessages(userId, conversationWith);

  res.status(httpStatus.OK).send(messages);
});

// Mark messages as read
const markMessagesAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { conversationWith } = req.body;

  logger.info(`User: ${userId} marking messages as read with User: ${conversationWith}`);

  await messageService.markMessagesAsRead(userId, conversationWith);

  res.status(httpStatus.OK).send({ message: 'Messages marked as read' });
});

const messageController = {
  sendBroadcastMessage,
  sendMessage,
  getMessages,
  markMessagesAsRead,
};

module.exports = messageController;
