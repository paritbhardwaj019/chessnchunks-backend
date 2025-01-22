const express = require('express');
const chatController = require('../controllers/chat.controller');
const checkJWT = require('../../../middlewares/checkJWT');

const chatRouter = express.Router();

chatRouter.post('/', checkJWT, chatController.sendChatMessage);

chatRouter.get('/', checkJWT, chatController.getChatMessages);

module.exports = chatRouter;
