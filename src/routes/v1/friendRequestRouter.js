const express = require('express');
const friendRequestController = require('../../controllers/friendRequest.controller');
const checkJWT = require('../../middlewares/checkJWT');

const friendRequestRouter = express.Router();

// Send a friend request
friendRequestRouter.post(
  '/',
  checkJWT,
  friendRequestController.sendFriendRequest
);

// Respond to a friend request
friendRequestRouter.post(
  '/respond',
  checkJWT,
  friendRequestController.respondToFriendRequest
);

// Get friend requests for the user
friendRequestRouter.get(
  '/',
  checkJWT,
  friendRequestController.getFriendRequests
);

module.exports = friendRequestRouter;
