const cron = require('node-cron');

const db = require('../database/prisma');
const sendEmail = require('../utils/sendEmail');
const logger = require('../utils/logger');

const checkAndUpdateExpiredBatches = async () => {
  try {
    const currentDate = new Date();

    const expiredBatches = await db.batch.findMany({
      where: {
        endDate: {
          lt: currentDate,
        },
        isActive: true,
      },
      include: {
        coaches: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        students: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        academy: {
          select: {
            name: true,
          },
        },
      },
    });

    for (const batch of expiredBatches) {
      await db.batch.update({
        where: {
          id: batch.id,
        },
        data: {
          isActive: false,
        },
      });

      const coachEmails = batch.coaches.map((coach) => ({
        email: coach.email,
        name: `${coach.profile?.firstName} ${coach.profile?.lastName}`,
      }));

      const studentEmails = batch.students.map((student) => ({
        email: student.email,
        name: `${student.profile?.firstName} ${student.profile?.lastName}`,
      }));

      for (const coach of coachEmails) {
        await sendEmail({
          to: coach.email,
          subject: `Batch ${batch.batchCode} Has Ended`,
          template: 'batch-ended-notification',
          data: {
            recipientName: coach.name,
            batchCode: batch.batchCode,
            academyName: batch.academy.name,
            endDate: batch.endDate,
            role: 'coach',
          },
        });
      }

      for (const student of studentEmails) {
        await sendEmail({
          to: student.email,
          subject: `Batch ${batch.batchCode} Has Ended`,
          template: 'batch-ended-notification',
          data: {
            recipientName: student.name,
            batchCode: batch.batchCode,
            academyName: batch.academy.name,
            endDate: batch.endDate,
            role: 'student',
          },
        });
      }
    }

    `Batch status check completed. Updated ${expiredBatches.length} batches to inactive.`;
  } catch (error) {
    logger.error(`Error checking batch status: ${error.message || error}`);
  }
};

const scheduleBatchStatusCheck = () => {
  cron.schedule('1 0 * * *', async () => {
    ('Running batch status check...');
    await checkAndUpdateExpiredBatches();
  });
};

module.exports = {
  checkAndUpdateExpiredBatches,
  scheduleBatchStatusCheck,
};
