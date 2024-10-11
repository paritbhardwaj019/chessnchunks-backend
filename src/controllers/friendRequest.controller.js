const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const friendRequestService = require('../services/friendRequest.service');
const { io } = require('../app');

const sendFriendRequest = catchAsync(async (req, res) => {
  const senderId = req.user.id;
  const { receiverId } = req.body;

  const request = await friendRequestService.sendFriendRequest(senderId, receiverId);

  // Notify the receiver in real-time
  io.to(`user-${receiverId}`).emit('friend_request', {
    senderId,
    requestId: request.id,
    createdAt: new Date(),
  });

  res.status(httpStatus.OK).send(request);
});

const respondToFriendRequest = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { requestId, action } = req.body; // action can be 'ACCEPTED' or 'REJECTED'

  await friendRequestService.respondToFriendRequest(userId, requestId, action);

  res.status(httpStatus.OK).send({ message: 'Friend request updated' });
});

const getFriendRequests = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const requests = await friendRequestService.getFriendRequests(userId);

  res.status(httpStatus.OK).send(requests);
});

const friendRequestController = {
  sendFriendRequest,
  respondToFriendRequest,
  getFriendRequests,
};

module.exports = friendRequestController;
