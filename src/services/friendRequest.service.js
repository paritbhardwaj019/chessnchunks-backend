const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');

const sendFriendRequest = async (senderId, receiverId) => {
  // Check if a request already exists
  const existingRequest = await db.friendRequest.findFirst({
    where: {
      senderId,
      receiverId,
      status: 'PENDING',
    },
  });

  if (existingRequest) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Friend request already sent');
  }

  // Create a new friend request
  const request = await db.friendRequest.create({
    data: {
      senderId,
      receiverId,
      status: 'PENDING',
    },
  });

  return request;
};

const respondToFriendRequest = async (userId, requestId, action) => {
  const request = await db.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.receiverId !== userId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Friend request not found');
  }

  // Update the request status
  await db.friendRequest.update({
    where: { id: requestId },
    data: { status: action },
  });

  if (action === 'ACCEPTED') {
    // Create mutual normal friendships
    await db.friend.createMany({
      data: [
        { userId: userId, friendId: request.senderId, type: 'NORMAL' },
        { userId: request.senderId, friendId: userId, type: 'NORMAL' },
      ],
      skipDuplicates: true, // Avoid errors if friendship already exists
    });
  }
};

const getFriendRequests = async (userId) => {
  const requests = await db.friendRequest.findMany({
    where: {
      receiverId: userId,
      status: 'PENDING',
    },
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          profile: true,
        },
      },
    },
  });

  return requests;
};

const friendRequestService = {
  sendFriendRequest,
  respondToFriendRequest,
  getFriendRequests,
};

module.exports = friendRequestService;
