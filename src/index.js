const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const socketIo = require('socket.io');
const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(httpServer, {
  cors: {
    origin: '*', // Adjust according to your CORS policy
  },
});

// Expose io for controllers to use
app.set('io', io);

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user?.id || 'unknown user'}`);

  // Join user-specific room
  socket.join(`user-${socket.user?.id}`);

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user?.id}`);
  });
});

httpServer.listen(config.port, () => {
  logger.info('Server is running on ' + config.port);
});

module.exports = { httpServer, io }; // Ensure both the httpServer and io are exported
