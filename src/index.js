// index.js

const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const socket = require('./socket'); // Import the socket module
const { verifyJWTForSocket } = require('./utils/auth'); // Import the function
const messageService = require('./services/message.service'); // Import messageService

const httpServer = http.createServer(app);

const io = socket.init(httpServer);

// io.use(async (socket, next) => {
//   const token = socket.handshake.auth.token;
//   if (!token) {
//     logger.error('Authentication error: Token not provided');
//     return next(new Error('Authentication error: Token not provided'));
//   }

//   try {
//     logger.info(`User authenticated: ${user.id}`);
//     next();
//   } catch (err) {
//     logger.error(`Socket.IO Authentication Error: ${err.message}`);
//     next(new Error(`Authentication error: ${err.message}`));
//   }
// });

// Socket.IO connection handler
// io.on('connection', (socket) => {
//   logger.info(`User connected: ${socket.user?.id || 'unknown user'}`);

//   // Join user-specific room for private messages
//   socket.join(`user-${socket.user.id}`);
//   logger.info(
//     `User ${socket.user.id} joined private room: user-${socket.user.id}`
//   );

//   // Handle 'send_message' event from the client
//   socket.on('send_message', async ({ receiverId, content }) => {
//     logger.info(
//       `Socket.IO: User ${socket.user.id} sending message to User: ${receiverId}`
//     );

//     try {
//       // Use the messageService to send the message
//       const message = await messageService.sendMessage({
//         senderId: socket.user.id,
//         receiverId,
//         content,
//       });

//       // Emit the message to the receiver's user room
//       io.to(`user-${receiverId}`).emit('new_message', message);
//       logger.info(
//         `Socket.IO: Message sent from User: ${socket.user.id} to User: ${receiverId}`
//       );
//     } catch (err) {
//       logger.error(
//         `Socket.IO: Error sending message from User: ${socket.user.id} to User: ${receiverId}: ${err.message}`
//       );
//     }
//   });

//   // Handle disconnection
//   socket.on('disconnect', () => {
//     logger.info(`User disconnected: ${socket.user?.id || 'unknown user'}`);
//   });
// });

// Start the server and log the running status
httpServer.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
});

module.exports = { httpServer };
