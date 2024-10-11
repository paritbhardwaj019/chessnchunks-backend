// services/message.service.js

const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const socket = require('../socket');
// Send a broadcast message from coach to students in a batch
const sendBroadcastMessage = async ({ senderId, batchId, studentIds, content, isEmail }) => {
  logger.info(`Broadcast message initiated by user: ${senderId} for batch: ${batchId}`);

  // Validate that the sender is a coach of the batch
  const isCoachOfBatch = await db.batch.findFirst({
    where: {
      id: batchId,
      coaches: {
        some: {
          id: senderId,
        },
      },
    },
  });

  if (!isCoachOfBatch) {
    logger.error(`User: ${senderId} is not a coach of batch: ${batchId}`);
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not a coach of this batch');
  }

  let recipients;

  if (studentIds && studentIds.length > 0) {
    logger.info(`Sending message to specific students: ${studentIds}`);
    recipients = await db.user.findMany({
      where: {
        id: { in: studentIds },
        studentOfBatches: {
          some: {
            id: batchId,
          },
        },
      },
    });
  } else {
    logger.info(`Sending message to all students in batch: ${batchId}`);
    recipients = await db.user.findMany({
      where: {
        studentOfBatches: {
          some: {
            id: batchId,
          },
        },
      },
    });
  }

  if (recipients.length === 0) {
    logger.warn(`No students found in batch: ${batchId}`);
    throw new ApiError(httpStatus.NOT_FOUND, 'No students found in the batch');
  }

  logger.info(`Creating messages for ${recipients.length} recipients`);
  const messagesData = recipients.map((recipient) => ({
    senderId,
    receiverId: recipient.id,
    content,
    isReplyAllowed: true,
    batchId,
  }));

  await db.message.createMany({
    data: messagesData,
  });

  logger.info(`Messages sent by user: ${senderId} for batch: ${batchId}`);
  return { success: true, recipients: recipients.map((r) => r.id) };
};

// Send a message to another user
const sendMessage = async ({ senderId, receiverId, content }) => {
  logger.info(`User: ${senderId} sending message to User: ${receiverId}`);
  const receiver = await db.user.findUnique({ where: { id: receiverId } });
  if (!receiver) {
    logger.error(`Receiver not found: ${receiverId}`);
    throw new ApiError(httpStatus.NOT_FOUND, 'Receiver not found');
  }

  const areFriends = await db.user.findFirst({
    where: {
      id: senderId,
      friends: {
        some: {
          id: receiverId,
        },
      },
    },
  });

  const inSameBatch = await db.batch.findFirst({
    where: {
      students: {
        some: {
          id: senderId,
        },
      },
      students: {
        some: {
          id: receiverId,
        },
      },
    },
  });

  if (!areFriends && !inSameBatch) {
    logger.warn(`User: ${senderId} cannot message User: ${receiverId} as they are neither friends nor in the same batch`);
    throw new ApiError(httpStatus.FORBIDDEN, 'You cannot message this user');
  }

  const message = await db.message.create({
    data: {
      senderId,
      receiverId,
      content,
    },
  });

 // const io = socket.getIO(); // Get the Socket.IO instance
 // io.to(`user-${receiverId}`).emit('new_message', message);

  logger.info(`Message sent from User: ${senderId} to User: ${receiverId}`);
  return message;
};

// Get messages between two users
const getMessages = async (userId, conversationWith) => {
  logger.info(`Fetching messages between User: ${userId} and User: ${conversationWith}`);
  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: conversationWith },
        { senderId: conversationWith, receiverId: userId },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });
  logger.info(`Fetched ${messages.length} messages between User: ${userId} and User: ${conversationWith}`);
  return messages;
};

// Mark messages as read
const markMessagesAsRead = async (userId, conversationWith) => {
  logger.info(`Marking messages as read for User: ${userId} with User: ${conversationWith}`);
  await db.message.updateMany({
    where: {
      senderId: conversationWith,
      receiverId: userId,
      isRead: false,
    },
    data: { isRead: true },
  });
  logger.info(`Messages marked as read for User: ${userId} with User: ${conversationWith}`);
};

const messageService = {
  sendBroadcastMessage,
  sendMessage,
  getMessages,
  markMessagesAsRead,
};

module.exports = messageService;
