// controllers/messageController.js

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const messageService = require('../services/message.service');
const logger = require('../utils/logger');
const socket = require('../socket'); // Import the socket module

const sendBroadcastMessage = catchAsync(async (req, res) => {
  const { batchId, studentIds, content, isEmail } = req.body;
  const senderId = req.user.id;

  logger.info(`Coach: ${senderId} sending broadcast message to batch: ${batchId}`);

  const result = await messageService.sendBroadcastMessage({
    senderId,
    batchId,
    studentIds,
    content,
    isEmail,
  });

  // Get the io instance
  const io = socket.getIO();

  // Emit an event to all students in the batch
  result.recipients.forEach((studentId) => {
    io.to(`user-${studentId}`).emit('broadcast_message', {
      senderId,
      content,
    });
  });

  logger.info(`Broadcast message sent by Coach: ${senderId} to batch: ${batchId}`);

  res.status(httpStatus.OK).send({ message: 'Messages sent successfully' });
});

const sendMessage = catchAsync(async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user.id;

  

  logger.info(`User: ${senderId} sending message to User: ${receiverId}`);

  const message = await messageService.sendMessage({
    senderId,
    receiverId,
    content,
  });
  // Get the io instance
  const io = socket.getIO();

  // Emit the message to the receiver's user room
  io.to(`user-${receiverId}`).emit('new_message', message);

  

  res.status(httpStatus.OK).send(message);
});

const getMessages = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { conversationWith } = req.query;

  logger.info(`User: ${userId} fetching messages with User: ${conversationWith}`);

  const messages = await messageService.getMessages(userId, conversationWith);

  res.status(httpStatus.OK).send(messages);
});

const markMessagesAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { conversationWith } = req.body;

  logger.info(`User: ${userId} marking messages as read with User: ${conversationWith}`);

  await messageService.markMessagesAsRead(userId, conversationWith);

  res.status(httpStatus.OK).send({ message: 'Messages marked as read' });
});

// controllers/messageController.js

const getConversations = catchAsync(async (req, res) => {
  const userId = req.user.id;

  logger.info(`User: ${userId} fetching conversations`);

  const conversations = await messageService.getConversations(userId);

  res.status(httpStatus.OK).send(conversations);
});

const messageController = {
  sendBroadcastMessage,
  sendMessage,
  getMessages,
  markMessagesAsRead,
  getConversations, // Add this line
};

module.exports = messageController;
