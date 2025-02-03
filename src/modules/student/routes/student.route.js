const express = require('express');
const studentController = require('../controllers/student.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkRole = require('../../../middlewares/checkRole');
const ROLE_CONSTANT = require('../../../constants');

const studentRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Endpoints for managing students and their invitations
 */

/**
 * @swagger
 * /students/invite-student:
 *   post:
 *     summary: Invite a student to join the academy
 *     description: Invite a student to join the academy by sending an email invitation.
 *     tags: [Students]
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
 *                 description: The first name of the student
 *               lastName:
 *                 type: string
 *                 description: The last name of the student
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address of the student
 *               academyId:
 *                 type: string
 *                 description: The ID of the academy (required for SUPER_ADMIN only)
 *     responses:
 *       200:
 *         description: Student invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 studentInvitation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     type:
 *                       type: string
 *                     status:
 *                       type: string
 *                     data:
 *                       type: object
 *                     createdBy:
 *                       type: object
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Academy not found
 *       409:
 *         description: Email already exists or invitation already sent
 */
studentRouter.post(
  '/invite-student',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
    ROLE_CONSTANT.ROLE.ADMIN,
  ]),
  studentController.inviteStudentHandler
);

/**
 * @swagger
 * /students/verify-student:
 *   post:
 *     summary: Verify a student's invitation
 *     description: Verify a student's invitation using the token sent to their email.
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: The verification token sent to the student's email
 *     responses:
 *       200:
 *         description: Student verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 newStudent:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     assignedToAcademy:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *       400:
 *         description: Invalid token or invitation not found
 *       409:
 *         description: Email already exists or invitation already accepted
 */
studentRouter.post('/verify-student', studentController.verifyStudentHandler);

/**
 * @swagger
 * /students/all-students:
 *   get:
 *     summary: Fetch all students
 *     description: Retrieve a list of all students in the academy.
 *     tags: [Students]
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
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query to filter students by name, email, or code
 *     responses:
 *       200:
 *         description: List of students retrieved successfully
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
 *                       email:
 *                         type: string
 *                       status:
 *                         type: string
 *                       code:
 *                         type: string
 *                       lastLoginAt:
 *                         type: string
 *                         format: date-time
 *                       profile:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                           middleName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           dateOfBirth:
 *                             type: string
 *                             format: date-time
 *                           phoneNumber:
 *                             type: string
 *                           addressLine1:
 *                             type: string
 *                           addressLine2:
 *                             type: string
 *                           city:
 *                             type: string
 *                           state:
 *                             type: string
 *                           country:
 *                             type: string
 *                           parentName:
 *                             type: string
 *                           parentEmail:
 *                             type: string
 *                           chessComId:
 *                             type: string
 *                           lichessId:
 *                             type: string
 *                           uscfId:
 *                             type: string
 *                           imageUrl:
 *                             type: string
 *                       studentOfBatches:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             batchCode:
 *                               type: string
 *                             description:
 *                               type: string
 *                             studentCapacity:
 *                               type: number
 *                             currentClass:
 *                               type: string
 *                             currentLevel:
 *                               type: string
 *                             startDate:
 *                               type: string
 *                               format: date-time
 *                             isActive:
 *                               type: boolean
 *                             academy:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 domain:
 *                                   type: string
 *                       studentSubscriptions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             status:
 *                               type: string
 *                             startDate:
 *                               type: string
 *                               format: date-time
 *                             endDate:
 *                               type: string
 *                               format: date-time
 *                             academyPlan:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 type:
 *                                   type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
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
 *       404:
 *         description: Student role or academy not found
 */
studentRouter.get(
  '/all-students',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    ROLE_CONSTANT.ROLE.ADMIN,
    ROLE_CONSTANT.ROLE.COACH,
  ]),
  studentController.fetchAllStudentsHandler
);

/**
 * @swagger
 * /students/all-students-from-batch:
 *   get:
 *     summary: Fetch all students from a specific batch
 *     description: Retrieve a list of all students in a specific batch.
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the batch to fetch students from
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
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query to filter students by name, email, or code
 *     responses:
 *       200:
 *         description: List of students retrieved successfully
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
 *                       email:
 *                         type: string
 *                       status:
 *                         type: string
 *                       code:
 *                         type: string
 *                       lastLoginAt:
 *                         type: string
 *                         format: date-time
 *                       profile:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                           middleName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           dateOfBirth:
 *                             type: string
 *                             format: date-time
 *                           phoneNumber:
 *                             type: string
 *                           parentName:
 *                             type: string
 *                           parentEmail:
 *                             type: string
 *                           chessComId:
 *                             type: string
 *                           lichessId:
 *                             type: string
 *                           uscfId:
 *                             type: string
 *                           imageUrl:
 *                             type: string
 *                       studentOfBatches:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             batchCode:
 *                               type: string
 *                             currentClass:
 *                               type: string
 *                             currentLevel:
 *                               type: string
 *                             startDate:
 *                               type: string
 *                               format: date-time
 *                       studentGoals:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             puzzlesTarget:
 *                               type: number
 *                             puzzlesSolved:
 *                               type: number
 *                             puzzlesPassed:
 *                               type: number
 *                             weeklyGoal:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 code:
 *                                   type: string
 *                                 startDate:
 *                                   type: string
 *                                   format: date-time
 *                                 endDate:
 *                                   type: string
 *                                   format: date-time
 *                       batchHistory:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             fromDate:
 *                               type: string
 *                               format: date-time
 *                             oldClass:
 *                               type: string
 *                             newClass:
 *                               type: string
 *                             oldLevel:
 *                               type: string
 *                             newLevel:
 *                               type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 batchInfo:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     academyId:
 *                       type: string
 *                     academyName:
 *                       type: string
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Batch or student role not found
 */
studentRouter.get(
  '/all-students-from-batch',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.COACH,
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    ROLE_CONSTANT.ROLE.ADMIN,
  ]),
  studentController.fetchAllStudentsByBatchId
);

/**
 * @swagger
 * /students/move-student:
 *   patch:
 *     summary: Move a student to another batch
 *     description: Move a student from one batch to another.
 *     tags: [Students]
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
 *                 description: The ID of the student to move
 *               batchId:
 *                 type: string
 *                 description: The ID of the current batch
 *               toBatchId:
 *                 type: string
 *                 description: The ID of the destination batch
 *     responses:
 *       200:
 *         description: Student moved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 batchCode:
 *                   type: string
 *                 warning:
 *                   type: boolean
 *                 remainingCapacity:
 *                   type: number
 *       400:
 *         description: Invalid input or batch is full
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Student or batch not found
 */
studentRouter.patch(
  '/move-student',
  checkJWT,
  checkRole([
    ROLE_CONSTANT.ROLE.COACH,
    ROLE_CONSTANT.ROLE.SUPER_ADMIN,
    ROLE_CONSTANT.ROLE.ADMIN,
  ]),
  studentController.moveStudentToBatchHandler
);

/**
 * @swagger
 * /students/batchmates:
 *   get:
 *     summary: Get batchmates of the logged-in student
 *     description: Retrieve a list of all students who share the same batches as the logged-in student.
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of batchmates retrieved successfully
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
 *                       email:
 *                         type: string
 *                       profile:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                           middleName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           dateOfBirth:
 *                             type: string
 *                             format: date-time
 *                           phoneNumber:
 *                             type: string
 *                           parentName:
 *                             type: string
 *                           parentEmail:
 *                             type: string
 *                           chessComId:
 *                             type: string
 *                           lichessId:
 *                             type: string
 *                           uscfId:
 *                             type: string
 *                           imageUrl:
 *                             type: string
 *                       studentOfBatches:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             batchCode:
 *                               type: string
 *                             description:
 *                               type: string
 *                             currentClass:
 *                               type: string
 *                             currentLevel:
 *                               type: string
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Student not found or not enrolled in any batches
 */
studentRouter.get(
  '/batchmates',
  checkJWT,
  checkRole([ROLE_CONSTANT.ROLE.STUDENT]),
  studentController.getBatchmatesHandler
);

module.exports = studentRouter;
