const express = require('express');
const systemCodeController = require('../../controllers/systemCode.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkPermission = require('../../middlewares/checkPermission');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: System Code
 *   description: Endpoints for managing system codes
 */

/**
 * @swagger
 * /system-code:
 *   post:
 *     summary: Create a new system code
 *     description: Create a new system code configuration.
 *     tags: [System Code]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               module:
 *                 type: string
 *                 enum: [BATCH, PLAN, USER_SIGNUP, USER, ACADEMY_PROGRAM, QUIZ, QUIZ_QUESTION, TASK]
 *                 description: Module for which the system code is being created
 *               prefix:
 *                 type: string
 *                 description: Prefix for the system code
 *               description:
 *                 type: string
 *                 description: Description of the system code
 *     responses:
 *       201:
 *         description: System code created successfully
 *       400:
 *         description: Invalid input or system code already exists
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required permission
 */
router
  .route('/')
  .post(
    checkJWT,
    checkPermission('add', '/dashboard/system-code'),
    systemCodeController.createSystemCode
  );

/**
 * @swagger
 * /system-code:
 *   get:
 *     summary: Get all system codes
 *     description: Retrieve a list of all system codes.
 *     tags: [System Code]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of system codes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   module:
 *                     type: string
 *                   prefix:
 *                     type: string
 *                   description:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required permission
 */
router
  .route('/')
  .get(
    checkJWT,
    checkPermission('view', '/dashboard/system-code'),
    systemCodeController.getAllSystemCodes
  );

/**
 * @swagger
 * /system-code/{id}:
 *   patch:
 *     summary: Update a system code
 *     description: Update the status (active/inactive) of a system code.
 *     tags: [System Code]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the system code to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: Status of the system code (true for active, false for inactive)
 *     responses:
 *       200:
 *         description: System code updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required permission
 *       404:
 *         description: System code not found
 */
router
  .route('/:id')
  .patch(
    checkJWT,
    checkPermission('update', '/dashboard/system-code'),
    systemCodeController.updateSystemCode
  );

module.exports = router;
