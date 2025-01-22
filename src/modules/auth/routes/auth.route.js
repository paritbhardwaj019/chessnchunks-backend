const express = require('express');
const authController = require('../controllers/auth.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkRole = require('../../../middlewares/checkRole');

const authRouter = express.Router();

/**
 * @swagger
 * /auth/check-mfa:
 *   post:
 *     summary: Check MFA status for a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: MFA status checked successfully
 *       401:
 *         description: Unauthorized
 */
authRouter.post('/check-mfa', authController.checkMfaStatusHandler);

/**
 * @swagger
 * /auth/login-with-cicid:
 *   post:
 *     summary: Login with CIC ID
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cicId:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
authRouter.post('/login-with-cicid', authController.loginWithCicIdHandler);

/**
 * @swagger
 * /auth/login-with-password:
 *   post:
 *     summary: Login with password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
authRouter.post(
  '/login-with-password',
  authController.loginWithPasswordHandler
);

/**
 * @swagger
 * /auth/login-without-password:
 *   post:
 *     summary: Login without password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       401:
 *         description: Unauthorized
 */
authRouter.post(
  '/login-without-password',
  authController.loginWithoutPasswordHandler
);

/**
 * @swagger
 * /auth/verify-login:
 *   post:
 *     summary: Verify login without password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login verified successfully
 *       401:
 *         description: Unauthorized
 */
authRouter.post(
  '/verify-login',
  authController.verifyLoginWithoutPasswordHandler
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
authRouter.post('/forgot-password', authController.resetPasswordHandler);

/**
 * @swagger
 * /auth/verify-forgot-password:
 *   post:
 *     summary: Verify password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       401:
 *         description: Invalid or expired token
 */
authRouter.post(
  '/verify-forgot-password',
  authController.verifyResetPasswordHandler
);

/**
 * @swagger
 * /auth/update-password:
 *   post:
 *     summary: Update password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
authRouter.post(
  '/update-password',
  checkJWT,
  checkRole(['ADMIN', 'COACH', 'SUPER_ADMIN']),
  authController.updatePasswordHandler
);

module.exports = authRouter;
