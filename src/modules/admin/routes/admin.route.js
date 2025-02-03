const express = require('express');
const adminController = require('../controllers/admin.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkRole = require('../../../middlewares/checkRole');
const ROLE_CONSTANT = require('../../../constants');

const adminRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Endpoints for managing admins
 */

/**
 * @swagger
 * /admin:
 *   post:
 *     summary: Create a new admin
 *     description: Create a new admin for an academy.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: First name of the admin
 *               lastName:
 *                 type: string
 *                 description: Last name of the admin
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the admin
 *               contactNumber:
 *                 type: string
 *                 description: Contact number of the admin
 *               adminRole:
 *                 type: string
 *                 enum: [ACADEMY_ADMIN, MASTER_ADMIN]
 *                 description: Role of the admin (ACADEMY_ADMIN or MASTER_ADMIN)
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: Invalid input or email already exists
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role (SUPER_ADMIN or ADMIN)
 */
adminRouter.post(
  '/',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.SUPER_ADMIN, ROLE_CONSTANT.ROLE.ADMIN]),
  adminController.createAdminHandler
);

/**
 * @swagger
 * /admin:
 *   get:
 *     summary: Get all admins
 *     description: Retrieve a list of all admins for the academy.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for filtering admins
 *     responses:
 *       200:
 *         description: List of admins retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   email:
 *                     type: string
 *                   adminRole:
 *                     type: string
 *                   profile:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       phoneNumber:
 *                         type: string
 *                   role:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                   adminOfAcademies:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role (SUPER_ADMIN or ADMIN)
 */
adminRouter.get(
  '/',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.SUPER_ADMIN, ROLE_CONSTANT.ROLE.ADMIN]),
  adminController.getAllAdmins
);

/**
 * @swagger
 * /admin/verify-otp:
 *   post:
 *     summary: Verify admin OTP
 *     description: Verify the OTP sent to the admin's email during account setup.
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: OTP code sent to the admin's email
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the admin
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
adminRouter.post('/verify-otp', adminController.verifyAdminOTP);

/**
 * @swagger
 * /admin/set-password:
 *   post:
 *     summary: Set admin password
 *     description: Set a password for the admin account after OTP verification.
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the admin
 *               password:
 *                 type: string
 *                 description: New password for the admin account
 *     responses:
 *       200:
 *         description: Password set successfully
 *       400:
 *         description: Invalid input or account already activated
 *       404:
 *         description: User not found
 */
adminRouter.post('/set-password', adminController.setAdminPassword);

/**
 * @swagger
 * /admin/transfer-ownership:
 *   post:
 *     summary: Transfer ownership
 *     description: Transfer ownership of the academy from one admin to another.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromAdminId:
 *                 type: string
 *                 description: ID of the current master admin
 *               toAdminId:
 *                 type: string
 *                 description: ID of the new master admin
 *     responses:
 *       200:
 *         description: Ownership transferred successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role (ADMIN)
 *       404:
 *         description: Admin not found
 */
adminRouter.post(
  '/transfer-ownership',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.ADMIN]),
  adminController.transferOwnership
);

/**
 * @swagger
 * /admin/{id}:
 *   delete:
 *     summary: Delete an admin
 *     description: Delete an admin by their ID.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the admin to delete
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role (SUPER_ADMIN or ADMIN)
 *       404:
 *         description: Admin not found
 */
adminRouter.delete(
  '/:id',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.SUPER_ADMIN, ROLE_CONSTANT.ROLE.ADMIN]),
  adminController.deleteAdmin
);

module.exports = adminRouter;
