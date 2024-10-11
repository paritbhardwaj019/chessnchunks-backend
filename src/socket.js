// socket.js

let io;

module.exports = {
  init: function (server) {
    const socketIo = require('socket.io');
    io = socketIo(server, {
      cors: {
        origin: '*', // Allow any origin
        methods: ['GET', 'POST'], // Allow GET and POST methods
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
