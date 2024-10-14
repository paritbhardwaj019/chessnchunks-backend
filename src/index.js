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

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    logger.info('Authentication failed: Token not provided');
    return next(new Error('Authentication error: Token not provided'));
  }

  try {
    const user = await verifyJWTForSocket(token);
    socket.user = user;
    logger.info(`User authenticated: ${user.id}`);
    next();
  } catch (err) {
    logger.info(`Authentication failed: ${err.message}`);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user?.id;
  if (userId) {
    socket.join(`user-${userId}`);
    logger.info(`User connected and joined room: user-${userId}`);
  }

  socket.on('send_message', async ({ receiverId, content }) => {
    if (!userId)
      return logger.info('Message sending failed: Unauthenticated user');

    try {
      const message = await messageService.sendMessage({
        senderId: userId,
        receiverId,
        content,
      });

      io.to(`user-${receiverId}`).emit('new_message', message);
      logger.info(`Message sent from User ${userId} to User ${receiverId}`);
    } catch (err) {
      logger.info(`Message sending failed: ${err.message}`);
    }
  });

  socket.on('disconnect', () => {
    if (userId) logger.info(`User disconnected: ${userId}`);
  });
});

httpServer.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
});

module.exports = { httpServer };
