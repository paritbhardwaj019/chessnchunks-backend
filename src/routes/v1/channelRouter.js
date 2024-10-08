const express = require('express');
const channelController = require('../../controllers/channel.controller');
const checkJWT = require('../../middlewares/checkJWT');

const channelRouter = express.Router();

// Create a new channel
channelRouter.post(
  '/',
  checkJWT,
  channelController.createChannel
);

// Send a message in a channel
channelRouter.post(
  '/message',
  checkJWT,
  channelController.sendChannelMessage
);

// Join a channel
channelRouter.post(
  '/join',
  checkJWT,
  channelController.joinChannel
);

module.exports = channelRouter;
