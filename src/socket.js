let io;

module.exports = {
  init: function (server) {
    const socketIo = require('socket.io');
    io = socketIo(server, {
      cors: {
        origin: 'http://localhost:3000',
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
