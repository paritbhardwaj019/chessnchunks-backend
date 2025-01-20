const http = require('http');

const { Server } = require('socket.io');

const app = require('./app');
const config = require('./config');
const db = require('./database/prisma');
const messageService = require('./services/message.service');
const logger = require('./utils/logger');

let httpServer;

async function startServer() {
  try {
    await db.$connect();
    logger.info('Database connection successful');

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

        const message = await messageService.sendMessage({
          senderId: userId,
          receiverId,
          content,
        });

        io.to(`user-${receiverId}`).emit('new_message', message);
        logger.info(`Message sent from User ${userId} to User ${receiverId}`);
      });

      socket.on('disconnect', () => {
        if (userId) logger.info(`User disconnected: ${userId}`);
      });
    });

    httpServer.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to connect to the database:', error);
    process.exit(1);
  }
}

async function shutdown() {
  logger.info('Received shutdown signal. Closing server...');

  try {
    await db.$disconnect();
    logger.info('Database disconnected');

    if (httpServer) {
      await new Promise((resolve) => {
        httpServer.close(resolve);
      });
      logger.info('Server closed');
    }

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();
