const express = require('express');

const superAdminController = require('../../controllers/superAdmin.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const uploadFile = require('../../middlewares/uploadFile');

const superAdminRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Super Admin
 *   description: Endpoints for super admin operations
 */

/**
 * @swagger
 * /super-admin/invite-academy-admin:
 *   post:
 *     summary: Invite an academy admin
 *     description: Invite a new academy admin by sending an email invitation.
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: First name of the academy admin
 *               lastName:
 *                 type: string
 *                 description: Last name of the academy admin
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the academy admin
 *               academyName:
 *                 type: string
 *                 description: Name of the academy
 *               contactNumber:
 *                 type: string
 *                 description: Contact number of the academy admin
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo of the academy (optional)
 *     responses:
 *       200:
 *         description: Academy admin invited successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role (SUPER_ADMIN)
 */
superAdminRouter.post(
  '/invite-academy-admin',
  checkJWT,
  checkRole(['SUPER_ADMIN']),
  uploadFile.single('logo'),
  superAdminController.inviteAcademyAdminHandler
);

/**
 * @swagger
 * /super-admin/verify-academy-admin:
 *   post:
 *     summary: Verify an academy admin
 *     description: Verify the academy admin's invitation and complete the academy setup.
 *     tags: [Super Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Invitation token
 *               domain:
 *                 type: string
 *                 description: Domain for the academy
 *               stripeCustomerId:
 *                 type: string
 *                 description: Stripe customer ID for payment
 *               planId:
 *                 type: string
 *                 description: ID of the selected plan
 *     responses:
 *       200:
 *         description: Academy admin verified and academy created successfully
 *       400:
 *         description: Invalid input or expired token
 *       409:
 *         description: Conflict - Email or domain already exists
 */
superAdminRouter.post(
  '/verify-academy-admin',
  superAdminController.verifyAcademyAdminHandler
);

/**
 * @swagger
 * /super-admin/all-admins:
 *   get:
 *     summary: Fetch all admins by academy ID
 *     description: Retrieve a list of all admins for a specific academy.
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academyId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the academy
 *     responses:
 *       200:
 *         description: List of admins retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role (SUPER_ADMIN)
 */
superAdminRouter.get(
  '/all-admins',
  checkJWT,
  checkRole(['SUPER_ADMIN']),
  superAdminController.fetchAllAdminsByAcademyId
);

/**
 * @swagger
 * /super-admin/all-academies:
 *   get:
 *     summary: Fetch all academies
 *     description: Retrieve a list of all academies.
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of academies retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role (SUPER_ADMIN, ADMIN, or COACH)
 */
superAdminRouter.get(
  '/all-academies',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  superAdminController.fetchAllAcademiesHandler
);

/**
 * @swagger
 * /super-admin/plans:
 *   post:
 *     summary: Create a new plan
 *     description: Create a new subscription plan for academies.
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the plan
 *               maxUsers:
 *                 type: integer
 *                 description: Maximum number of users allowed
 *               academyPrice:
 *                 type: number
 *                 description: Price for academies
 *               subscriberPrice:
 *                 type: number
 *                 description: Price for subscribers
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of features included in the plan
 *     responses:
 *       201:
 *         description: Plan created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role (SUPER_ADMIN)
 */
superAdminRouter.post(
  '/plans',
  checkJWT,
  checkRole(['SUPER_ADMIN']),
  superAdminController.createPlanHandler
);

/**
 * @swagger
 * /super-admin/plans/{planId}:
 *   put:
 *     summary: Update a plan
 *     description: Update an existing subscription plan.
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the plan to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the plan
 *               maxUsers:
 *                 type: integer
 *                 description: Maximum number of users allowed
 *               academyPrice:
 *                 type: number
 *                 description: Price for academies
 *               subscriberPrice:
 *                 type: number
 *                 description: Price for subscribers
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of features included in the plan
 *     responses:
 *       200:
 *         description: Plan updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role (SUPER_ADMIN)
 */
superAdminRouter.put(
  '/plans/:planId',
  checkJWT,
  checkRole(['SUPER_ADMIN']),
  superAdminController.updatePlanHandler
);

/**
 * @swagger
 * /super-admin/plans:
 *   get:
 *     summary: Fetch all plans
 *     description: Retrieve a list of all subscription plans.
 *     tags: [Super Admin]
 *     responses:
 *       200:
 *         description: List of plans retrieved successfully
 */
superAdminRouter.get('/plans', superAdminController.fetchAllPlansHandler);

/**
 * @swagger
 * /super-admin/check-domain:
 *   get:
 *     summary: Check domain availability
 *     description: Check if a domain is available for use.
 *     tags: [Super Admin]
 *     parameters:
 *       - in: query
 *         name: domain
 *         schema:
 *           type: string
 *         required: true
 *         description: Domain to check
 *     responses:
 *       200:
 *         description: Domain availability status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 domain:
 *                   type: string
 *                 available:
 *                   type: boolean
 */
superAdminRouter.get(
  '/check-domain',
  superAdminController.checkDomainAvailability
);

/**
 * @swagger
 * /super-admin/select-plan:
 *   post:
 *     summary: Select an academy plan
 *     description: Select a plan for an academy during the signup process.
 *     tags: [Super Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signupId:
 *                 type: string
 *                 description: ID of the academy signup
 *               planId:
 *                 type: string
 *                 description: ID of the selected plan
 *               domain:
 *                 type: string
 *                 description: Domain for the academy
 *     responses:
 *       200:
 *         description: Plan selected successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Signup or plan not found
 *       409:
 *         description: Conflict - Domain is not available
 */
superAdminRouter.post('/select-plan', superAdminController.selectAcademyPlan);

/**
 * @swagger
 * /super-admin/create-checkout-session:
 *   post:
 *     summary: Create a checkout session
 *     description: Create a Stripe checkout session for academy plan payment.
 *     tags: [Super Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signupId:
 *                 type: string
 *                 description: ID of the academy signup
 *               planId:
 *                 type: string
 *                 description: ID of the selected plan
 *               domain:
 *                 type: string
 *                 description: Domain for the academy
 *               token:
 *                 type: string
 *                 description: Invitation token
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Plan not found
 */
superAdminRouter.post(
  '/create-checkout-session',
  superAdminController.createCheckoutSession
);

/**
 * @swagger
 * /super-admin/plans/{planId}:
 *   delete:
 *     summary: Delete a plan
 *     description: Delete an existing subscription plan.
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the plan to delete
 *     responses:
 *       200:
 *         description: Plan deleted successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required role (SUPER_ADMIN)
 *       404:
 *         description: Plan not found
 */
superAdminRouter.delete(
  '/plans/:planId',
  checkJWT,
  checkRole(['SUPER_ADMIN']),
  superAdminController.deletePlanHandler
);

module.exports = superAdminRouter;
