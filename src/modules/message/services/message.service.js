const httpStatus = require('http-status');
const db = require('../../../database/prisma');
const ApiError = require('../../../utils/apiError');
const logger = require('../../../utils/logger');
const notificationService = require('../../notification/services/notification.service');

const sendBroadcastMessage = async ({
  senderId,
  batchId,
  studentIds,
  content,
}) => {
  logger.info(
    `Broadcast message initiated by user: ${senderId} for batch: ${batchId}`
  );

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

  const sender = await db.user.findUnique({
    where: { id: senderId },
    include: { profile: true },
  });

  if (!sender) {
    logger.error(`Sender not found: ${senderId}`);
    throw new ApiError(httpStatus.NOT_FOUND, 'Sender not found');
  }

  logger.info(`Creating messages for ${recipients.length} recipients`);
  const messagesData = recipients.map((recipient) => ({
    senderId,
    receiverId: recipient.id,
    content,
    isReplyAllowed: true,
    batchId,
  }));

  const createdMessages = await Promise.all(
    messagesData.map((data) => db.message.create({ data }))
  );

  await Promise.all(
    createdMessages.map(async (message) => {
      await notificationService.createMessageNotificationHandler(
        message,
        sender
      );
    })
  );

  logger.info(`Messages sent by user: ${senderId} for batch: ${batchId}`);
  return { success: true, recipients: recipients.map((r) => r.id) };
};

const sendMessage = async ({ senderId, receiverId, content }) => {
  const receiver = await db.user.findUnique({ where: { id: receiverId } });
  if (!receiver) {
    logger.error(`Receiver not found: ${receiverId}`);
    throw new ApiError(httpStatus.NOT_FOUND, 'Receiver not found');
  }

  await db.user.findFirst({
    where: {
      id: senderId,
      friends: {
        some: {
          id: receiverId,
        },
      },
    },
  });

  await db.batch.findFirst({
    where: {
      students: {
        some: {
          id: senderId,
        },
      },
    },
  });

  const message = await db.message.create({
    data: {
      senderId,
      receiverId,
      content,
    },
  });

  // Fetch sender details
  const sender = await db.user.findUnique({
    where: { id: senderId },
    include: { profile: true },
  });

  if (!sender) {
    logger.error(`Sender not found: ${senderId}`);
    throw new ApiError(httpStatus.NOT_FOUND, 'Sender not found');
  }

  // Create notification
  await notificationService.createMessageNotificationHandler(message, sender);

  logger.info(`Message sent from User: ${senderId} to User: ${receiverId}`);
  return message;
};
const getMessages = async (userId, conversationWith) => {
  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: conversationWith },
        { senderId: conversationWith, receiverId: userId },
      ],
    },
    select: {
      senderId: true,
      receiverId: true,
      content: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return messages;
};

const markMessagesAsRead = async (userId, conversationWith) => {
  logger.info(
    `Marking messages as read for User: ${userId} with User: ${conversationWith}`
  );
  await db.message.updateMany({
    where: {
      senderId: conversationWith,
      receiverId: userId,
      isRead: false,
    },
    data: { isRead: true },
  });
  logger.info(
    `Messages marked as read for User: ${userId} with User: ${conversationWith}`
  );
};

const getConversations = async (userId) => {
  try {
    const sentMessages = await db.message.findMany({
      where: {
        senderId: userId,
      },
      select: {
        receiverId: true,
      },
    });

    const receivedMessages = await db.message.findMany({
      where: {
        receiverId: userId,
      },
      select: {
        senderId: true,
      },
    });

    const partnerIdsSet = new Set();

    sentMessages.forEach((msg) => {
      if (msg.receiverId) partnerIdsSet.add(msg.receiverId);
    });

    receivedMessages.forEach((msg) => {
      if (msg.senderId) partnerIdsSet.add(msg.senderId);
    });

    const partnerIds = Array.from(partnerIdsSet);

    if (partnerIds.length === 0) {
      logger.info(`No conversations found for User: ${userId}`);
      return [];
    }

    const conversations = await Promise.all(
      partnerIds.map(async (partnerId) => {
        const user = await db.user.findUnique({
          where: { id: partnerId },
          include: { profile: true },
        });

        if (!user || !user.profile) {
          return null;
        }

        const latestMessage = await db.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: partnerId },
              { senderId: partnerId, receiverId: userId },
            ],
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (!latestMessage) {
          return null;
        }

        return {
          userId: user.id,
          email: user.email,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          image: user.profile.imageUrl,
          lastMessage: latestMessage.content,
          lastMessageTime: latestMessage.createdAt,
        };
      })
    );

    const validConversations = conversations.filter(
      (conversation) => conversation !== null
    );

    return validConversations;
  } catch (error) {
    logger.error(`Error fetching conversations for User: ${userId}`, error);
    throw error;
  }
};

const messageService = {
  sendBroadcastMessage,
  sendMessage,
  getMessages,
  markMessagesAsRead,
  getConversations,
};

module.exports = messageService;
