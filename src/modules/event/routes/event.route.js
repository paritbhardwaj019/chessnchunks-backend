const express = require('express');
const eventController = require('../controllers/event.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkPermission = require('../../../middlewares/checkPermission');
const checkRole = require('../../../middlewares/checkRole');

const eventRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Endpoints for managing events
 */

/**
 * @swagger
 * /student:
 *   get:
 *     summary: Get all events for student's academy
 *     description: Fetch all events for the student's academy.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - User is not a student
 */
eventRouter
  .route('/student')
  .get(
    checkJWT,
    checkRole(['STUDENT']),
    eventController.fetchAcademyEventsHandler
  );

/**
 * @swagger
 * /:
 *   post:
 *     summary: Create a new event
 *     description: Create a new event for the user's academy.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the event
 *               description:
 *                 type: string
 *                 description: Description of the event
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Start date of the event
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: End date of the event
 *     responses:
 *       200:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 academy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 createdBy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     profile:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
eventRouter
  .route('/')
  .post(
    checkJWT,
    checkPermission('add', '/dashboard/calendar'),
    eventController.createEventHandler
  );

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get all events for the academy
 *     description: Fetch all events for the user's academy.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                   academy:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                   createdBy:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       email:
 *                         type: string
 *                       profile:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
eventRouter
  .route('/')
  .get(
    checkJWT,
    checkPermission('view', '/dashboard/calendar'),
    eventController.fetchAcademyEventsHandler
  );

/**
 * @swagger
 * /{eventId}:
 *   put:
 *     summary: Edit an event
 *     description: Edit an existing event by its ID.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the event to edit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated title of the event
 *               description:
 *                 type: string
 *                 description: Updated description of the event
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Updated start date of the event
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Updated end date of the event
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 academy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 createdBy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     profile:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Event not found
 */
eventRouter.route('/:eventId').put(checkJWT, eventController.editEventHandler);

/**
 * @swagger
 * /{eventId}:
 *   delete:
 *     summary: Delete an event
 *     description: Delete an event by its ID.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the event to delete
 *     responses:
 *       204:
 *         description: Event deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Event not found
 */
eventRouter
  .route('/:eventId')
  .delete(checkJWT, eventController.deleteEventHandler);

module.exports = eventRouter;
