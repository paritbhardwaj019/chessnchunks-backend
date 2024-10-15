const express = require('express');

// Import all routers
const academyRouter = require('./academy.route');
const superAdminRouter = require('./superAdmin.route');
const coachRouter = require('./coach.route');
const adminRouter = require('./admin.route');
const batchRouter = require('./batch.route');
const authRouter = require('./auth.route');
const studentRouter = require('./student.route');
const invitationRouter = require('./invitation.route');
const userRouter = require('./user.route');
const dashboardRouter = require('./dashboard.route');
const goalRouter = require('./goal.route');

// New imports for communication features
const messageRouter = require('./messageRouter');
const chatRouter = require('./chatRouter');
const friendRequestRouter = require('./friendRequestRouter');
const channelRouter = require('./channelRouter');
const taskRouter = require('./task.routes')

const router = express.Router();

// Register routes for existing modules
router.use('/academy', academyRouter);
router.use('/superadmin', superAdminRouter);
router.use('/admin', adminRouter);
router.use('/coach', coachRouter);
router.use('/batch', batchRouter);
router.use('/auth', authRouter);
router.use('/student', studentRouter);
router.use('/invitation', invitationRouter);
router.use('/user', userRouter);
router.use('/dashboard', dashboardRouter);
router.use('/goal', goalRouter);

router.use('/task',taskRouter);

// Register new routes for communication features
router.use('/messages', messageRouter); // Routes for messaging system
router.use('/chats', chatRouter); // Routes for chat system
router.use('/friend-requests', friendRequestRouter); // Routes for friend requests
router.use('/channels', channelRouter); // Routes for broadcast channels

module.exports = router;
