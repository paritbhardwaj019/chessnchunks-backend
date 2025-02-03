const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config');
const db = require('./database/prisma');
const messageService = require('./modules/message/services/message.service');
const logger = require('./utils/logger');

let httpServer;
let isDbConnected = false;

async function connectToDatabase() {
  try {
    await db.$connect();
    isDbConnected = true;
    logger.info('Database connection successful');
  } catch (error) {
    isDbConnected = false;
    logger.error('Failed to connect to the database:', error);
  }
}

async function startServer() {
  connectToDatabase();

  httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    if (userId) {
      socket.join(`user-${userId}`);
      logger.info(`User connected and joined room: user-${userId}`);
    }

    socket.on('send_message', async ({ receiverId, content }) => {
      if (!userId) {
        logger.info('Message sending failed: Unauthenticated user');
        return;
      }

      if (!isDbConnected) {
        socket.emit('error', {
          message: 'Database connection is currently unavailable',
        });
        logger.error(`Message sending failed: Database not connected`);
        return;
      }

      try {
        const message = await messageService.sendMessage({
          senderId: userId,
          receiverId,
          content,
        });

        io.to(`user-${receiverId}`).emit('new_message', message);
        logger.info(`Message sent from User ${userId} to User ${receiverId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
        logger.error(`Message sending failed:`, error);
      }
    });

    socket.on('disconnect', () => {
      if (userId) logger.info(`User disconnected: ${userId}`);
    });
  });

  httpServer.listen(config.port, () => {
    logger.info(`Server is running on port ${config.port}`);
  });

  if (!isDbConnected) {
    const retryInterval = 30000;
    setInterval(async () => {
      if (!isDbConnected) {
        logger.info('Attempting to reconnect to database...');
        await connectToDatabase();
      }
    }, retryInterval);
  }
}

startServer();
