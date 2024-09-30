const express = require('express');
const academyRouter = require('./academy.route');
const superAdminRouter = require('./superAdmin.route');
const coachRouter = require('./coach.route');
const adminRouter = require('./admin.route');
const batchRouter = require('./batch.route');

const router = express.Router();

router.use('/academy', academyRouter);
router.use('/superadmin', superAdminRouter);
router.use('/admin', adminRouter);
router.use('/coach', coachRouter);
router.use('/batch', batchRouter);

module.exports = router;
