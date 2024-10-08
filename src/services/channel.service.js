const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');

// Create a new channel
const createChannel = async ({ creatorId, name, batchId }) => {
  // Validate that the creator is authorized
  const creator = await db.user.findUnique({ where: { id: creatorId } });

  if (!creator) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // If batchId is provided, ensure the creator is part of the batch
  if (batchId) {
    const isInBatch = await db.batch.findFirst({
      where: {
        id: batchId,
        OR: [
          { coaches: { some: { id: creatorId } } },
          { students: { some: { id: creatorId } } },
        ],
      },
    });

    if (!isInBatch) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not part of this batch');
    }
  }

  const channel = await db.channel.create({
    data: {
      name,
      batchId,
      members: {
        connect: { id: creatorId },
      },
    },
  });

  return channel;
};

// Get channel members
const getChannelMembers = async (channelId) => {
  const channel = await db.channel.findUnique({
    where: { id: channelId },
    include: {
      members: true,
    },
  });

  if (!channel) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Channel not found');
  }

  return channel.members;
};

// Send a message in a channel
const sendChannelMessage = async ({ senderId, channelId, content }) => {
  // Validate that the sender is a member of the channel
  const isMember = await db.channel.findFirst({
    where: {
      id: channelId,
      members: {
        some: {
          id: senderId,
        },
      },
    },
  });

  if (!isMember) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not a member of this channel');
  }

  const message = await db.channelMessage.create({
    data: {
      channelId,
      senderId,
      content,
    },
  });

  return message;
};

// Join a channel
const joinChannel = async ({ userId, channelId }) => {
  // Add the user to the channel members
  await db.channel.update({
    where: { id: channelId },
    data: {
      members: {
        connect: { id: userId },
      },
    },
  });
};

const channelService = {
  createChannel,
  getChannelMembers,
  sendChannelMessage,
  joinChannel,
};

module.exports = channelService;
