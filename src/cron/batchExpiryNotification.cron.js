const { subDays } = require('date-fns');
const cron = require('node-cron');

const logger = require('../utils/logger');

const db = require('../database/prisma');
const sendEmail = require('../utils/sendEmail');

const checkBatchExpiryAndNotify = async () => {
  try {
    // Get current date
    const currentDate = new Date();
    // Calculate date 14 days from now
    const fourteenDaysFromNow = subDays(currentDate, -14);

    // Find batches that will expire in 14 days and haven't sent warning emails
    const batchesToNotify = await db.batch.findMany({
      where: {
        endDate: {
          // Check if end date is around 14 days from now (within 24 hours window)
          gte: new Date(fourteenDaysFromNow.setHours(0, 0, 0, 0)),
          lt: new Date(fourteenDaysFromNow.setHours(23, 59, 59, 999)),
        },
        isActive: true,
        warningMailSent: false,
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

    // Process each batch
    for (const batch of batchesToNotify) {
      // Collect all emails
      const coachEmails = batch.coaches.map((coach) => ({
        email: coach.email,
        name: `${coach.profile?.firstName} ${coach.profile?.lastName}`,
      }));

      const studentEmails = batch.students.map((student) => ({
        email: student.email,
        name: `${student.profile?.firstName} ${student.profile?.lastName}`,
      }));

      // Send emails to coaches
      for (const coach of coachEmails) {
        await sendEmail({
          to: coach.email,
          subject: `Batch ${batch.batchCode} Expiring Soon`,
          template: 'batch-expiry-notification',
          data: {
            recipientName: coach.name,
            batchCode: batch.batchCode,
            academyName: batch.academy.name,
            endDate: batch.endDate,
            role: 'coach',
          },
        });
      }

      // Send emails to students
      for (const student of studentEmails) {
        await sendEmail({
          to: student.email,
          subject: `Batch ${batch.batchCode} Expiring Soon`,
          template: 'batch-expiry-notification',
          data: {
            recipientName: student.name,
            batchCode: batch.batchCode,
            academyName: batch.academy.name,
            endDate: batch.endDate,
            role: 'student',
          },
        });
      }

      // Mark batch as notified
      await db.batch.update({
        where: {
          id: batch.id,
        },
        data: {
          warningMailSent: true,
        },
      });
    }

    `Batch expiry check completed. Notified ${batchesToNotify.length} batches.`;
  } catch (error) {
    logger.error(`Error checking batch expiry: ${error.message || error}`);
  }
};

// Schedule the job to run every day at 00:00 (midnight)
const scheduleBatchExpiryCheck = () => {
  cron.schedule('0 0 * * *', async () => {
    ('Running batch expiry check...');
    await checkBatchExpiryAndNotify();
  });
};

module.exports = {
  checkBatchExpiryAndNotify,
  scheduleBatchExpiryCheck,
};
