const express = require('express');
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

const router = express.Router();

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

module.exports = router;
