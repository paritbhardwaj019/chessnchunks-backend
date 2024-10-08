const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');

// Send a chat message between students in the same batch
const sendChatMessage = async ({ senderId, receiverId, content }) => {
  // Check if both users are in the same batch
  const commonBatch = await db.batch.findFirst({
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

  if (!commonBatch) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only chat with students in your batch');
  }

  const message = await db.message.create({
    data: {
      senderId,
      receiverId,
      content,
      isReplyAllowed: true,
    },
  });

  return message;
};

// Get chat messages between two students
const getChatMessages = async (userId, conversationWith) => {
  // Fetch messages between userId and conversationWith
  const messages = await db.message.findMany({
    where: {
      OR: [
        {
          senderId: userId,
          receiverId: conversationWith,
        },
        {
          senderId: conversationWith,
          receiverId: userId,
        },
      ],
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return messages;
};

const chatService = {
  sendChatMessage,
  getChatMessages,
};

module.exports = chatService;
