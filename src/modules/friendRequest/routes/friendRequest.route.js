const express = require('express');
const friendRequestController = require('../controllers/friendRequest.controller');
const checkJWT = require('../../../middlewares/checkJWT');

const friendRequestRouter = express.Router();

friendRequestRouter.post(
  '/',
  checkJWT,
  friendRequestController.sendFriendRequest
);

friendRequestRouter.post(
  '/respond',
  checkJWT,
  friendRequestController.respondToFriendRequest
);

friendRequestRouter.get(
  '/',
  checkJWT,
  friendRequestController.getFriendRequests
);

module.exports = friendRequestRouter;
