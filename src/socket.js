const config = require('./config');

let io;

module.exports = {
  init: function (server) {
    const socketIo = require('socket.io');
    io = socketIo(server, {
      cors: {
        origin: config.allowedOrigins,
        methods: ['GET', 'POST'],
        allowedHeaders: ['x-auth-token'],
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
