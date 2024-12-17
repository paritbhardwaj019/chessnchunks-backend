const socketIO = require('socket.io');
const logger = require('./utils/logger');
const SOCKET_EVENTS = require('./config/socketEvents');
const { isOriginAllowed } = require('./services/origin.service');

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

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, async (data) => {
      try {
        const { receiverId, content, senderId } = data;

        io.to(`user-${receiverId}`).emit(SOCKET_EVENTS.NEW_MESSAGE, {
          senderId,
          receiverId,
          content,
          timestamp: new Date(),
        });
      } catch (error) {
        socket.emit(SOCKET_EVENTS.ERROR, {
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
