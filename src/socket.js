const socketIO = require('socket.io');

const SOCKET_EVENTS = require('./config/socketEvents');
const { isOriginAllowed } = require('./services/origin.service');
const logger = require('./utils/logger');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    logger.info(`New socket connected - ${socket.id}`);

    socket.on('newMessage', async (data) => {
      try {
        const { receiverId, senderId, content } = data;

        io.to(`user-${receiverId}`)
          .to(`user-${senderId}`)
          .emit('receiveMessage', {
            senderId,
            receiverId,
            content,
            createdAt: new Date(),
          });

        logger.info(`Message emitted from ${senderId} to ${receiverId}`);
      } catch (error) {
        logger.error('Error handling new message:', error);
        socket.emit('error', {
          message: 'Failed to process message',
        });
      }
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
