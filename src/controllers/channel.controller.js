const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const channelService = require('../services/channel.service');
const { io } = require('../app');

const createChannel = catchAsync(async (req, res) => {
  const creatorId = req.user.id;
  const { name, batchId } = req.body;

  const channel = await channelService.createChannel({ creatorId, name, batchId });

  // Notify users to join the channel room
  const members = await channelService.getChannelMembers(channel.id);
  members.forEach((member) => {
    io.to(`user-${member.id}`).emit('join_channel', {
      channelId: channel.id,
    });
  });

  res.status(httpStatus.OK).send(channel);
});

const sendChannelMessage = catchAsync(async (req, res) => {
  const senderId = req.user.id;
  const { channelId, content } = req.body;

  const message = await channelService.sendChannelMessage({ senderId, channelId, content });

  // Emit the message to the channel room
  io.to(`channel-${channelId}`).emit('channel_message', message);

  res.status(httpStatus.OK).send(message);
});

const joinChannel = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { channelId } = req.body;

  await channelService.joinChannel({ userId, channelId });

  // Join the Socket.IO room
  req.socket.join(`channel-${channelId}`);

  res.status(httpStatus.OK).send({ message: 'Joined channel successfully' });
});

const channelController = {
  createChannel,
  sendChannelMessage,
  joinChannel,
};

module.exports = channelController;
