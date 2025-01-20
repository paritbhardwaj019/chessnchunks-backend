const cron = require('node-cron');

const studentSignupService = require('../services/studentSignup.service');
const logger = require('../utils/logger');

const initializeCronJobs = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running expired signups check cron job');
      const expiredCount = await studentSignupService.handleExpiredSignups();
      logger.info(`Processed ${expiredCount} expired signups`);
    } catch (error) {
      logger.error('Error in expired signups cron job:', error);
    }
  });

  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Running cleanup cron job');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const cleanupResult = await db.userSignup.deleteMany({
        where: {
          signupStatus: 'EXPIRED',
          updatedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      logger.info(`Cleaned up ${cleanupResult.count} old expired signups`);
    } catch (error) {
      logger.error('Error in cleanup cron job:', error);
    }
  });
};

module.exports = initializeCronJobs;
