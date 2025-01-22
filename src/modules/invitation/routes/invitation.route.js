const express = require('express');
const invitationController = require('../controllers/invitation.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkPermission = require('../../../middlewares/checkPermission');

const invitationRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Invitations
 *   description: Endpoints for managing invitations
 */

/**
 * @swagger
 * /invitations/all-invitations:
 *   get:
 *     summary: Fetch all invitations
 *     description: Retrieve a list of all invitations.
 *     tags: [Invitations]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CREATE_ACADEMY, BATCH_COACH, BATCH_STUDENT]
 *         description: Type of invitation to filter by
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for filtering invitations
 *     responses:
 *       200:
 *         description: List of invitations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                   email:
 *                     type: string
 *                   data:
 *                     type: object
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   academySignup:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       academyName:
 *                         type: string
 *                       requestedDomain:
 *                         type: string
 *                       finalDomain:
 *                         type: string
 *                       status:
 *                         type: string
 *                       paymentStatus:
 *                         type: string
 *                       paymentAmount:
 *                         type: number
 *                       paymentDate:
 *                         type: string
 *                         format: date-time
 *                       selectedPlan:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required permission
 */
invitationRouter.get(
  '/all-invitations',
  checkJWT,
  checkPermission('view', '/dashboard/invitations'),
  invitationController.fetchAllInvitationsHandler
);

/**
 * @swagger
 * /invitations/{id}:
 *   delete:
 *     summary: Delete an invitation
 *     description: Delete an invitation by its ID.
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the invitation to delete
 *     responses:
 *       200:
 *         description: Invitation deleted successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required permission
 *       404:
 *         description: Invitation not found
 */
invitationRouter.delete(
  '/:id',
  checkJWT,
  checkPermission('delete', '/dashboard/invitations'),
  invitationController.deleteInvitationHandler
);

/**
 * @swagger
 * /invitations/{id}:
 *   patch:
 *     summary: Edit an invitation
 *     description: Edit an invitation by its ID (e.g., update the email address).
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the invitation to edit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *                 description: New email address for the invitation
 *     responses:
 *       200:
 *         description: Invitation updated successfully
 *       400:
 *         description: Invalid input or invitation is already accepted/expired
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User does not have the required permission
 *       404:
 *         description: Invitation not found
 */
invitationRouter.patch(
  '/:id',
  checkJWT,
  checkPermission('update', '/dashboard/invitations'),
  invitationController.editInvitationHandler
);

module.exports = invitationRouter;
