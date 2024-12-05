const config = require('./config');
const { isOriginAllowed } = require('./services/origin.service');

let io;

module.exports = {
  init: function (server) {
    const socketIo = require('socket.io');
    io = socketIo(server, {
      cors: {
        origin: (origin, callback) => {
          if (!origin || isOriginAllowed(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Origin not allowed'));
          }
        },
        methods: ['GET', 'POST'],
        allowedHeaders: ['x-auth-token', 'content-type'],
        credentials: true,
      },
    });
    return io;
  },
  getIO: function () {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },
};
