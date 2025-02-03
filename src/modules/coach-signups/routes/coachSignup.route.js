const express = require('express');
const coachSignupController = require('../controllers/coachSignup.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkRole = require('../../../middlewares/checkRole');
const ROLE_CONSTANT = require('../../../constants');

const coachSignupRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Coach Signup
 *   description: Endpoints for managing coach signups
 */

/**
 * @swagger
 * /coach-signup:
 *   post:
 *     summary: Initiate a coach signup
 *     description: Initiate a new coach signup by providing an email and academy ID.
 *     tags: [Coach Signup]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Email address of the coach
 *               academyId:
 *                 type: string
 *                 description: ID of the academy the coach is signing up for
 *     responses:
 *       201:
 *         description: Coach signup initiated successfully
 *       400:
 *         description: Invalid input or email already registered
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role
 */
coachSignupRouter.post(
  '/',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.ADMIN]),
  coachSignupController.initiateCoachSignupHandler
);

/**
 * @swagger
 * /coach-signup/{signupId}:
 *   put:
 *     summary: Update a coach signup
 *     description: Update the details of a coach signup by its ID.
 *     tags: [Coach Signup]
 *     parameters:
 *       - in: path
 *         name: signupId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the coach signup to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: First name of the coach
 *               lastName:
 *                 type: string
 *                 description: Last name of the coach
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number of the coach
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth of the coach
 *               addressLine1:
 *                 type: string
 *                 description: Address line 1 of the coach
 *               addressLine2:
 *                 type: string
 *                 description: Address line 2 of the coach
 *               city:
 *                 type: string
 *                 description: City of the coach
 *               state:
 *                 type: string
 *                 description: State of the coach
 *               country:
 *                 type: string
 *                 description: Country of the coach
 *               zipCode:
 *                 type: string
 *                 description: ZIP code of the coach
 *               chessComId:
 *                 type: string
 *                 description: Chess.com ID of the coach
 *               lichessId:
 *                 type: string
 *                 description: Lichess ID of the coach
 *               uscfId:
 *                 type: string
 *                 description: USCF ID of the coach
 *               coachType:
 *                 type: string
 *                 description: Type of coach (e.g., HEAD_COACH, ASSISTANT_COACH)
 *     responses:
 *       200:
 *         description: Coach signup updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role
 *       404:
 *         description: Coach signup not found
 */
coachSignupRouter.put(
  '/:signupId',
  coachSignupController.updateCoachSignupHandler
);

/**
 * @swagger
 * /coach-signup/verify-otp:
 *   post:
 *     summary: Verify coach signup OTP
 *     description: Verify the OTP sent to the coach's email during signup.
 *     tags: [Coach Signup]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signupId:
 *                 type: string
 *                 description: ID of the coach signup
 *               otp:
 *                 type: string
 *                 description: OTP code sent to the coach's email
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: Coach signup not found
 */
coachSignupRouter.post(
  '/verify-otp',
  coachSignupController.verifyCoachSignupOTPHandler
);

/**
 * @swagger
 * /coach-signup/{signupId}/complete:
 *   post:
 *     summary: Complete a coach signup
 *     description: Complete the coach signup process by providing a password and profile data.
 *     tags: [Coach Signup]
 *     parameters:
 *       - in: path
 *         name: signupId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the coach signup to complete
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Password for the coach's account
 *               profileData:
 *                 type: object
 *                 description: Profile data for the coach
 *     responses:
 *       200:
 *         description: Coach signup completed successfully
 *       400:
 *         description: Invalid input or signup not ready for completion
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role
 *       404:
 *         description: Coach signup not found
 */
coachSignupRouter.post(
  '/:signupId/complete',
  coachSignupController.completeCoachSignupHandler
);

/**
 * @swagger
 * /coach-signup/{signupId}:
 *   get:
 *     summary: Get a coach signup by ID
 *     description: Retrieve details of a specific coach signup by its ID.
 *     tags: [Coach Signup]
 *     parameters:
 *       - in: path
 *         name: signupId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the coach signup to retrieve
 *     responses:
 *       200:
 *         description: Coach signup details retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role
 *       404:
 *         description: Coach signup not found
 */
coachSignupRouter.get(
  '/:signupId',
  coachSignupController.getCoachSignupByIdHandler
);

/**
 * @swagger
 * /coach-signup:
 *   get:
 *     summary: Get all coach signups
 *     description: Retrieve a list of all coach signups with optional filtering and pagination.
 *     tags: [Coach Signup]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for filtering coach signups
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by signup status (e.g., INQUIRY, CONFIRMED, COMPLETED)
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *         description: Filter by signup stage (e.g., INQUIRY, PRE_ACTIVATION, PAYMENT, POST_ACTIVATION)
 *       - in: query
 *         name: academyId
 *         schema:
 *           type: string
 *         description: Filter by academy ID
 *     responses:
 *       200:
 *         description: List of coach signups retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role
 */
coachSignupRouter.get(
  '/',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.ADMIN, ROLE_CONSTANT.ADMIN_ROLE.MASTER_ADMIN]),
  coachSignupController.fetchAllCoachSignupsHandler
);

module.exports = coachSignupRouter;
