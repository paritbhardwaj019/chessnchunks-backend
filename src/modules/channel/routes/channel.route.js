const express = require('express');
const channelController = require('../controllers/channel.controller');
const checkJWT = require('../../../middlewares/checkJWT');

const channelRouter = express.Router();

channelRouter.post('/', checkJWT, channelController.createChannel);

channelRouter.post('/message', checkJWT, channelController.sendChannelMessage);

channelRouter.post('/join', checkJWT, channelController.joinChannel);

module.exports = channelRouter;
