const express = require('express');
const goalController = require('../controllers/goal.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkPermission = require('../../../middlewares/checkPermission');
const checkRole = require('../../../middlewares/checkRole');

const goalRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Goals
 *   description: Endpoints for managing goals (seasonal, monthly, weekly) and assigning them to students
 */

/**
 * @swagger
 * /goals/assign-goal-to-batch:
 *   post:
 *     summary: Assign a weekly goal to a batch
 *     description: Assign a weekly goal to all students in a specific batch.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               weeklyGoalId:
 *                 type: string
 *                 description: The ID of the weekly goal to assign
 *               batchId:
 *                 type: string
 *                 description: The ID of the batch to assign the goal to
 *     responses:
 *       200:
 *         description: Weekly goal assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                   description: The number of students the goal was assigned to
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Batch or weekly goal not found
 */
goalRouter.post(
  '/assign-goal-to-batch',
  checkJWT,
  checkPermission('add', '/dashboard/goals/assign-weekly'),
  goalController.assignWeeklyGoalHandler
);

/**
 * @swagger
 * /goals/create-seasonal:
 *   post:
 *     summary: Create a seasonal goal
 *     description: Create a new seasonal goal for a specific batch.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: The start date of the seasonal goal
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: The end date of the seasonal goal
 *               batchId:
 *                 type: string
 *                 description: The ID of the batch to associate the goal with
 *     responses:
 *       200:
 *         description: Seasonal goal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 code:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
goalRouter.post(
  '/create-seasonal',
  checkJWT,
  checkPermission('add', '/dashboard/goals/seasonal'),
  goalController.createSeasonalGoalHandler
);

/**
 * @swagger
 * /goals/create-monthly:
 *   post:
 *     summary: Create a monthly goal
 *     description: Create a new monthly goal for a specific seasonal goal.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seasonalGoalId:
 *                 type: string
 *                 description: The ID of the seasonal goal to associate the monthly goal with
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: The start date of the monthly goal
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: The end date of the monthly goal
 *               batchId:
 *                 type: string
 *                 description: The ID of the batch to associate the goal with
 *     responses:
 *       200:
 *         description: Monthly goal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 code:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
goalRouter.post(
  '/create-monthly',
  checkJWT,
  checkPermission('add', '/dashboard/goals/monthly'),
  goalController.createMonthlyGoalHandler
);

/**
 * @swagger
 * /goals/create-weekly:
 *   post:
 *     summary: Create a weekly goal
 *     description: Create a new weekly goal for a specific monthly goal.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               monthlyGoalId:
 *                 type: string
 *                 description: The ID of the monthly goal to associate the weekly goal with
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: The start date of the weekly goal
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: The end date of the weekly goal
 *               noOfGames:
 *                 type: number
 *                 description: The target number of games for the weekly goal
 *               minReviews:
 *                 type: number
 *                 description: The minimum number of reviews required
 *               midReviews:
 *                 type: number
 *                 description: The mid-range number of reviews required
 *               maxReviews:
 *                 type: number
 *                 description: The maximum number of reviews required
 *               batchId:
 *                 type: string
 *                 description: The ID of the batch to associate the goal with
 *     responses:
 *       200:
 *         description: Weekly goal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 code:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
goalRouter.post(
  '/create-weekly',
  checkJWT,
  checkPermission('add', '/dashboard/goals/weekly'),
  goalController.createWeeklyGoalHandler
);

/**
 * @swagger
 * /goals/seasonal-goals:
 *   get:
 *     summary: Fetch all seasonal goals
 *     description: Retrieve a list of all seasonal goals for the logged-in user.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: The number of items per page
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: string
 *         description: The ID of the batch to filter by
 *     responses:
 *       200:
 *         description: List of seasonal goals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   code:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                   _count:
 *                     type: object
 *                     properties:
 *                       monthlyGoals:
 *                         type: number
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
goalRouter.get(
  '/seasonal-goals',
  checkJWT,
  checkPermission('view', '/dashboard/goals/seasonal'),
  goalController.getAllSeasonalGoalsHandler
);

/**
 * @swagger
 * /goals/monthly-goals:
 *   get:
 *     summary: Fetch all monthly goals
 *     description: Retrieve a list of all monthly goals for the logged-in user.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: The number of items per page
 *       - in: query
 *         name: seasonalGoalId
 *         schema:
 *           type: string
 *         description: The ID of the seasonal goal to filter by
 *     responses:
 *       200:
 *         description: List of monthly goals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   code:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                   _count:
 *                     type: object
 *                     properties:
 *                       weeklyGoals:
 *                         type: number
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
goalRouter.get(
  '/monthly-goals',
  checkJWT,
  checkPermission('view', '/dashboard/goals/monthly'),
  goalController.getAllMonthlyGoalsHandler
);

/**
 * @swagger
 * /goals/weekly-goals:
 *   get:
 *     summary: Fetch all weekly goals
 *     description: Retrieve a list of all weekly goals for the logged-in user.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: The number of items per page
 *       - in: query
 *         name: monthlyGoalId
 *         schema:
 *           type: string
 *         description: The ID of the monthly goal to filter by
 *     responses:
 *       200:
 *         description: List of weekly goals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   code:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
goalRouter.get(
  '/weekly-goals',
  checkJWT,
  checkPermission('view', '/dashboard/goals/weekly'),
  goalController.getAllWeeklyGoalsHandler
);

/**
 * @swagger
 * /goals/seasonal-goals/options:
 *   get:
 *     summary: Fetch seasonal goals for dropdown options
 *     description: Retrieve a list of seasonal goals for use in dropdown options.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: string
 *         description: The ID of the batch to filter by
 *     responses:
 *       200:
 *         description: List of seasonal goals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   code:
 *                     type: string
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
goalRouter.get(
  '/seasonal-goals/options',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.getSeasonalGoalsForOptions
);

/**
 * @swagger
 * /goals/monthly-goals/options:
 *   get:
 *     summary: Fetch monthly goals for dropdown options
 *     description: Retrieve a list of monthly goals for use in dropdown options.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: seasonalGoalId
 *         schema:
 *           type: string
 *         description: The ID of the seasonal goal to filter by
 *     responses:
 *       200:
 *         description: List of monthly goals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   code:
 *                     type: string
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
goalRouter.get(
  '/monthly-goals/options',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.getMonthlyGoalsForOptions
);

/**
 * @swagger
 * /goals/weekly-goals/options:
 *   get:
 *     summary: Fetch weekly goals for dropdown options
 *     description: Retrieve a list of weekly goals for use in dropdown options.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: string
 *         description: The ID of the batch to filter by
 *       - in: query
 *         name: monthlyGoalId
 *         schema:
 *           type: string
 *         description: The ID of the monthly goal to filter by
 *     responses:
 *       200:
 *         description: List of weekly goals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   code:
 *                     type: string
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
goalRouter.get(
  '/weekly-goals/options',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.getWeeklyGoalsForOptions
);

/**
 * @swagger
 * /goals/generate-student-pdf:
 *   post:
 *     summary: Generate a PDF report for a student's performance
 *     description: Generate a PDF report summarizing a student's performance for a specific season.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: The ID of the student
 *               seasonId:
 *                 type: string
 *                 description: The ID of the season to generate the report for
 *     responses:
 *       200:
 *         description: PDF report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filePath:
 *                   type: string
 *                   description: The file path of the generated PDF
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Student or season not found
 */
goalRouter.post(
  '/generate-student-pdf',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.generateStudentPDFReportHandler
);

/**
 * @swagger
 * /goals/student-weekly-goals:
 *   get:
 *     summary: Fetch all weekly goals for a student
 *     description: Retrieve a list of all weekly goals assigned to the logged-in student.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of weekly goals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   weeklyGoalCode:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                   puzzlesTarget:
 *                     type: number
 *                   puzzlesSolved:
 *                     type: number
 *                   puzzlesPassed:
 *                     type: number
 *                   isCustom:
 *                     type: boolean
 *                   assignedBy:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
goalRouter.get(
  '/student-weekly-goals',
  checkJWT,
  checkRole(['STUDENT']),
  goalController.fetchAllWeeklyGoalsHandler
);

/**
 * @swagger
 * /goals/assigned-weekly-goals:
 *   get:
 *     summary: Fetch all assigned weekly goals
 *     description: Retrieve a list of all weekly goals assigned to students.
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: The number of items per page
 *     responses:
 *       200:
 *         description: List of assigned weekly goals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       studentId:
 *                         type: string
 *                       studentEmail:
 *                         type: string
 *                       studentName:
 *                         type: string
 *                       weeklyGoalId:
 *                         type: string
 *                       puzzlesTarget:
 *                         type: number
 *                       puzzlesSolved:
 *                         type: number
 *                       puzzlesPassed:
 *                         type: number
 *                       isCustom:
 *                         type: boolean
 *                       weeklyGoal:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           code:
 *                             type: string
 *                           startDate:
 *                             type: string
 *                             format: date-time
 *                           endDate:
 *                             type: string
 *                             format: date-time
 *                           target:
 *                             type: object
 *                           monthlyGoal:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               code:
 *                                 type: string
 *                               startDate:
 *                                 type: string
 *                                 format: date-time
 *                               endDate:
 *                                 type: string
 *                                 format: date-time
 *                               seasonalGoal:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   code:
 *                                     type: string
 *                                   startDate:
 *                                     type: string
 *                                     format: date-time
 *                                   endDate:
 *                                     type: string
 *                                     format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
goalRouter.get(
  '/assigned-weekly-goals',
  checkJWT,
  checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
  goalController.getAllAssignedWeeklyGoalsHandler
);

module.exports = goalRouter;
