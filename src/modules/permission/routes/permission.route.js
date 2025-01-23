const express = require('express');
const permissionController = require('../controllers/permission.controller');
const checkJWT = require('../../../middlewares/checkJWT');

const permissionRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Endpoints for managing user permissions and roles
 */

/**
 * @swagger
 * /permissions/roles:
 *   get:
 *     summary: Fetch all roles
 *     description: Retrieve a list of all roles and their associated permissions.
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The unique identifier for the role
 *                   name:
 *                     type: string
 *                     description: The name of the role
 *                   rolePermissions:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         permission:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             resource:
 *                               type: string
 *                             action:
 *                               type: string
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
permissionRouter.get('/roles', checkJWT, permissionController.fetchAllRoles);

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Fetch user permissions
 *     description: Retrieve permissions for the currently logged-in user.
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   resource:
 *                     type: string
 *                     description: The resource the permission applies to
 *                   action:
 *                     type: string
 *                     description: The action allowed on the resource
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: User not found
 */
permissionRouter
  .route('/')
  .get(checkJWT, permissionController.fetchUserPermission);

/**
 * @swagger
 * /permissions:
 *   put:
 *     summary: Update role permissions
 *     description: Update permissions for a specific role.
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleId:
 *                 type: string
 *                 description: The ID of the role to update
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     resource:
 *                       type: string
 *                       description: The resource the permission applies to
 *                     action:
 *                       type: string
 *                       description: The action allowed on the resource
 *     responses:
 *       200:
 *         description: Role permissions updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                   description: The number of permissions updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Role not found
 */
permissionRouter
  .route('/')
  .put(checkJWT, permissionController.updatePermission);

module.exports = permissionRouter;
