const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const adminController = require('../../controllers/admin.controller');

const adminRouter = express.Router();

adminRouter.post(
  '/',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN']),
  adminController.createAdminHandler
);

adminRouter.get(
  '/',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN']),
  adminController.getAllAdmins
);

adminRouter.post('/verify-otp', adminController.verifyAdminOTP);

adminRouter.post('/set-password', adminController.setAdminPassword);

adminRouter.post(
  '/transfer-ownership',
  checkJWT,
  checkRole(['ADMIN']),
  adminController.transferOwnership
);

adminRouter.delete(
  '/:id',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN']),
  adminController.deleteAdmin
);

module.exports = adminRouter;
