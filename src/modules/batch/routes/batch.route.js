const express = require('express');
const batchController = require('../controllers/batch.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkPermission = require('../../../middlewares/checkPermission');
const checkRole = require('../../../middlewares/checkRole');

const batchRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Batches
 *   description: Endpoints for managing batches
 */

/**
 * @swagger
 * /options:
 *   get:
 *     summary: Get batch options
 *     description: Fetch batch options for dropdowns and selectors.
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Batch options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   batchCode:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   batchDay:
 *                     type: string
 *                   startTime:
 *                     type: string
 *                   studentCapacity:
 *                     type: number
 *                   academy:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                   _count:
 *                     type: object
 *                     properties:
 *                       students:
 *                         type: number
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
batchRouter.get(
  '/options',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  batchController.fetchAllBatchesForOptions
);

/**
 * @swagger
 * /{id}/students:
 *   post:
 *     summary: Add student to batch
 *     description: Add a student to a specific batch.
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the batch to add the student to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: ID of the student to add
 *     responses:
 *       200:
 *         description: Student added to batch successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 studentCapacity:
 *                   type: number
 *                 batchCode:
 *                   type: string
 *                 startLevel:
 *                   type: string
 *                 currentLevel:
 *                   type: string
 *                 description:
 *                   type: string
 *                 warningCutoff:
 *                   type: number
 *                 currentClass:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 batchDay:
 *                   type: string
 *                 startTime:
 *                   type: string
 *                 warningMailSent:
 *                   type: boolean
 *                 students:
 *                   type: array
 *                   items:
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
 *                 academy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 coaches:
 *                   type: array
 *                   items:
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
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Batch or student not found
 */
batchRouter.post(
  '/:id/students',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  batchController.addStudentToBatchHandler
);

/**
 * @swagger
 * /{id}/coaches:
 *   post:
 *     summary: Add coach to batch
 *     description: Add a coach to a specific batch.
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the batch to add the coach to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coachId:
 *                 type: string
 *                 description: ID of the coach to add
 *     responses:
 *       200:
 *         description: Coach added to batch successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 studentCapacity:
 *                   type: number
 *                 batchCode:
 *                   type: string
 *                 startLevel:
 *                   type: string
 *                 currentLevel:
 *                   type: string
 *                 description:
 *                   type: string
 *                 warningCutoff:
 *                   type: number
 *                 currentClass:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 batchDay:
 *                   type: string
 *                 startTime:
 *                   type: string
 *                 warningMailSent:
 *                   type: boolean
 *                 students:
 *                   type: array
 *                   items:
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
 *                 academy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 coaches:
 *                   type: array
 *                   items:
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
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Batch or coach not found
 */
batchRouter.post(
  '/:id/coaches',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN']),
  batchController.addCoachToBatchHandler
);

/**
 * @swagger
 * /{id}/coaches:
 *   get:
 *     summary: Get all coaches by batch ID
 *     description: Fetch all coaches associated with a specific batch.
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the batch to fetch coaches for
 *     responses:
 *       200:
 *         description: List of coaches retrieved successfully
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
 *                   profile:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                   role:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                   subRole:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Batch not found
 */
batchRouter.get(
  '/:id/coaches',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  batchController.getAllCoachesByBatchIdHandler
);

/**
 * @swagger
 * /:
 *   post:
 *     summary: Create a new batch
 *     description: Create a new batch with students, coaches, and other details.
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentCapacity:
 *                 type: number
 *                 description: Maximum number of students in the batch
 *               description:
 *                 type: string
 *                 description: Description of the batch
 *               academyId:
 *                 type: string
 *                 description: ID of the academy the batch belongs to
 *               warningCutoff:
 *                 type: number
 *                 description: Warning cutoff percentage for student capacity
 *               currentClass:
 *                 type: string
 *                 description: Current class of the batch
 *               startLevel:
 *                 type: string
 *                 description: Starting level of the batch
 *               currentLevel:
 *                 type: string
 *                 description: Current level of the batch
 *               coaches:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs of coaches assigned to the batch
 *               students:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs of students assigned to the batch
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Start date of the batch
 *               batchDay:
 *                 type: string
 *                 description: Day of the week the batch runs
 *               startTime:
 *                 type: string
 *                 description: Start time of the batch
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: End date of the batch
 *     responses:
 *       200:
 *         description: Batch created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 studentCapacity:
 *                   type: number
 *                 batchCode:
 *                   type: string
 *                 startLevel:
 *                   type: string
 *                 currentLevel:
 *                   type: string
 *                 description:
 *                   type: string
 *                 warningCutoff:
 *                   type: number
 *                 currentClass:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 batchDay:
 *                   type: string
 *                 startTime:
 *                   type: string
 *                 warningMailSent:
 *                   type: boolean
 *                 students:
 *                   type: array
 *                   items:
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
 *                 academy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 coaches:
 *                   type: array
 *                   items:
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
 *                 createdByUser:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     profile:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                 modifiedByUser:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     profile:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
batchRouter
  .route('/')
  .post(
    checkJWT,
    checkPermission('add', '/dashboard/batches'),
    batchController.createBatchHandler
  );

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get all batches
 *     description: Fetch all batches with pagination, search, and sorting.
 *     tags: [Batches]
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
 *         description: Search query for filtering batches
 *     responses:
 *       200:
 *         description: List of batches retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   studentCapacity:
 *                     type: number
 *                   batchCode:
 *                     type: string
 *                   startLevel:
 *                     type: string
 *                   currentLevel:
 *                     type: string
 *                   description:
 *                     type: string
 *                   warningCutoff:
 *                     type: number
 *                   currentClass:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *                   batchDay:
 *                     type: string
 *                   startTime:
 *                     type: string
 *                   warningMailSent:
 *                     type: boolean
 *                   students:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         profile:
 *                           type: object
 *                           properties:
 *                             firstName:
 *                               type: string
 *                             lastName:
 *                               type: string
 *                   academy:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                   coaches:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         profile:
 *                           type: object
 *                           properties:
 *                             firstName:
 *                               type: string
 *                             lastName:
 *                               type: string
 *                   createdByUser:
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
 *                   modifiedByUser:
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
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
batchRouter
  .route('/')
  .get(
    checkJWT,
    checkPermission('view', '/dashboard/batches'),
    batchController.fetchAllBatches
  );

/**
 * @swagger
 * /{id}:
 *   put:
 *     summary: Update batch by ID
 *     description: Update a batch's details by its ID.
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the batch to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentCapacity:
 *                 type: number
 *                 description: Maximum number of students in the batch
 *               description:
 *                 type: string
 *                 description: Description of the batch
 *               warningCutoff:
 *                 type: number
 *                 description: Warning cutoff percentage for student capacity
 *               currentClass:
 *                 type: string
 *                 description: Current class of the batch
 *               startLevel:
 *                 type: string
 *                 description: Starting level of the batch
 *               currentLevel:
 *                 type: string
 *                 description: Current level of the batch
 *               batchDay:
 *                 type: string
 *                 description: Day of the week the batch runs
 *               startTime:
 *                 type: string
 *                 description: Start time of the batch
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Start date of the batch
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: End date of the batch
 *               isActive:
 *                 type: boolean
 *                 description: Whether the batch is active
 *               coaches:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs of coaches assigned to the batch
 *               students:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs of students assigned to the batch
 *     responses:
 *       200:
 *         description: Batch updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 batch:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     studentCapacity:
 *                       type: number
 *                     batchCode:
 *                       type: string
 *                     startLevel:
 *                       type: string
 *                     currentLevel:
 *                       type: string
 *                     description:
 *                       type: string
 *                     warningCutoff:
 *                       type: number
 *                     currentClass:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     batchDay:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                     warningMailSent:
 *                       type: boolean
 *                     students:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           email:
 *                             type: string
 *                           profile:
 *                             type: object
 *                             properties:
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                     academy:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                     coaches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           email:
 *                             type: string
 *                           profile:
 *                             type: object
 *                             properties:
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                     createdByUser:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                         profile:
 *                           type: object
 *                           properties:
 *                             firstName:
 *                               type: string
 *                             lastName:
 *                               type: string
 *                     modifiedByUser:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                         profile:
 *                           type: object
 *                           properties:
 *                             firstName:
 *                               type: string
 *                             lastName:
 *                               type: string
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 warningStatus:
 *                   type: object
 *                   properties:
 *                     isNearCapacity:
 *                       type: boolean
 *                     isFull:
 *                       type: boolean
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Batch not found
 */
batchRouter
  .route('/:id')
  .put(
    checkJWT,
    checkPermission('update', '/dashboard/batches'),
    batchController.updateBatchHandler
  );

/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: Delete batch by ID
 *     description: Delete a batch by its ID.
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the batch to delete
 *     responses:
 *       200:
 *         description: Batch deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Batch deleted successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Batch not found
 */
batchRouter
  .route('/:id')
  .delete(
    checkJWT,
    checkPermission('delete', '/dashboard/batches'),
    batchController.deleteBatchHandler
  );

/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: Get batch by ID
 *     description: Fetch a batch's details by its ID.
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the batch to fetch
 *     responses:
 *       200:
 *         description: Batch details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 studentCapacity:
 *                   type: number
 *                 batchCode:
 *                   type: string
 *                 startLevel:
 *                   type: string
 *                 currentLevel:
 *                   type: string
 *                 description:
 *                   type: string
 *                 warningCutoff:
 *                   type: number
 *                 currentClass:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 batchDay:
 *                   type: string
 *                 startTime:
 *                   type: string
 *                 warningMailSent:
 *                   type: boolean
 *                 students:
 *                   type: array
 *                   items:
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
 *                       role:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                 coaches:
 *                   type: array
 *                   items:
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
 *                       role:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                       subRole:
 *                         type: string
 *                 academy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 createdByUser:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     profile:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                 modifiedByUser:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     profile:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Batch not found
 */
batchRouter
  .route('/:id')
  .get(
    checkJWT,
    checkRole(['SUPER_ADMIN', 'COACH', 'ADMIN']),
    batchController.fetchBatchById
  );

module.exports = batchRouter;
