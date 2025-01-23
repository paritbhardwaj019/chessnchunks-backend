const express = require('express');
const academyProgramController = require('../controllers/academyProgram.controller');
const checkJWT = require('../../../middlewares/checkJWT');

const academyProgramRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Academy Programs
 *   description: Endpoints for managing academy programs
 */

/**
 * @swagger
 * /academy/{academyId}:
 *   get:
 *     summary: Get all programs for an academy
 *     description: Fetch all active programs for a specific academy.
 *     tags: [Academy Programs]
 *     parameters:
 *       - in: path
 *         name: academyId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the academy to fetch programs for
 *     responses:
 *       200:
 *         description: List of programs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *                   duration:
 *                     type: string
 *                   price:
 *                     type: number
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                   studentSubscriptions:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         status:
 *                           type: string
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             profile:
 *                               type: object
 *                               properties:
 *                                 firstName:
 *                                   type: string
 *                                 lastName:
 *                                   type: string
 *                   cartItems:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         status:
 *                           type: string
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             profile:
 *                               type: object
 *                               properties:
 *                                 firstName:
 *                                   type: string
 *                                 lastName:
 *                                   type: string
 *       400:
 *         description: Invalid academy ID
 *       404:
 *         description: No programs found for the academy
 */
academyProgramRouter.get(
  '/academy/:academyId',
  academyProgramController.getAcademyPrograms
);

/**
 * @swagger
 * /options:
 *   get:
 *     summary: Get program options
 *     description: Fetch program options for dropdowns and selectors.
 *     tags: [Academy Programs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Program options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *                   duration:
 *                     type: string
 *                   price:
 *                     type: number
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
academyProgramRouter.get(
  '/options',
  checkJWT,
  academyProgramController.getProgramOptions
);

/**
 * @swagger
 * /{id}/subscribers:
 *   get:
 *     summary: Get program subscribers
 *     description: Fetch all subscribers for a specific program.
 *     tags: [Academy Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the program to fetch subscribers for
 *     responses:
 *       200:
 *         description: List of subscribers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   status:
 *                     type: string
 *                   paymentStatus:
 *                     type: string
 *                   autoRenew:
 *                     type: boolean
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                   lastBillingDate:
 *                     type: string
 *                     format: date-time
 *                   nextBillingDate:
 *                     type: string
 *                     format: date-time
 *                   stripeSubscriptionId:
 *                     type: string
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Program not found
 */
academyProgramRouter.get(
  '/:id/subscribers',
  checkJWT,
  academyProgramController.getProgramSubscribers
);

/**
 * @swagger
 * /{id}/credits:
 *   put:
 *     summary: Update program credits
 *     description: Update credit points, discount rules, and late payment fees for a program.
 *     tags: [Academy Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the program to update credits for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               creditPoints:
 *                 type: number
 *                 description: Credit points for the program
 *               condition:
 *                 type: string
 *                 description: Condition for applying credits
 *               discountRules:
 *                 type: object
 *                 description: Discount rules for the program
 *               discountAmount:
 *                 type: number
 *                 description: Discount amount for the program
 *               latePaymentFees:
 *                 type: number
 *                 description: Late payment fees for the program
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Due date for payments
 *     responses:
 *       200:
 *         description: Program credits updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 creditPoints:
 *                   type: number
 *                 condition:
 *                   type: string
 *                 discountRules:
 *                   type: object
 *                 discountAmount:
 *                   type: number
 *                 latePaymentFees:
 *                   type: number
 *                 dueDate:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Program not found
 */
academyProgramRouter.put(
  '/:id/credits',
  checkJWT,
  academyProgramController.updateProgramCredits
);

/**
 * @swagger
 * /:
 *   post:
 *     summary: Create a new program
 *     description: Create a new academy program with signup fee handling.
 *     tags: [Academy Programs]
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
 *                 description: Name of the program
 *               type:
 *                 type: string
 *                 description: Type of the program
 *               seasonPrice:
 *                 type: number
 *                 description: Seasonal price of the program
 *               monthlyPrice:
 *                 type: number
 *                 description: Monthly price of the program
 *               yearlyDiscountPercentage:
 *                 type: number
 *                 description: Yearly discount percentage
 *               description:
 *                 type: string
 *                 description: Description of the program
 *               discountRules:
 *                 type: object
 *                 description: Discount rules for the program
 *               discountAmount:
 *                 type: number
 *                 description: Discount amount for the program
 *               latePaymentFees:
 *                 type: number
 *                 description: Late payment fees for the program
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Due date for payments
 *     responses:
 *       201:
 *         description: Program created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 type:
 *                   type: string
 *                 seasonPrice:
 *                   type: number
 *                 monthlyPrice:
 *                   type: number
 *                 yearlyDiscountPercentage:
 *                   type: number
 *                 description:
 *                   type: string
 *                 discountRules:
 *                   type: object
 *                 discountAmount:
 *                   type: number
 *                 latePaymentFees:
 *                   type: number
 *                 dueDate:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
academyProgramRouter
  .route('/')
  .post(checkJWT, academyProgramController.createProgram);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get all programs
 *     description: Fetch all active programs with pagination, search, and sorting.
 *     tags: [Academy Programs]
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
 *         description: Search query for filtering programs
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, type, duration, startDate, endDate, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (asc or desc)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by program type
 *       - in: query
 *         name: duration
 *         schema:
 *           type: string
 *         description: Filter by program duration
 *       - in: query
 *         name: startDateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date (from)
 *       - in: query
 *         name: startDateTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date (to)
 *       - in: query
 *         name: priceFrom
 *         schema:
 *           type: number
 *         description: Filter by price (from)
 *       - in: query
 *         name: priceTo
 *         schema:
 *           type: number
 *         description: Filter by price (to)
 *     responses:
 *       200:
 *         description: List of programs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       duration:
 *                         type: string
 *                       price:
 *                         type: number
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       endDate:
 *                         type: string
 *                         format: date-time
 *                       studentSubscriptions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             status:
 *                               type: string
 *                             user:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 profile:
 *                                   type: object
 *                                   properties:
 *                                     firstName:
 *                                       type: string
 *                                     lastName:
 *                                       type: string
 *                       cartItems:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             status:
 *                               type: string
 *                             user:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 profile:
 *                                   type: object
 *                                   properties:
 *                                     firstName:
 *                                       type: string
 *                                     lastName:
 *                                       type: string
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                 limit:
 *                   type: integer
 *                   description: Number of items per page
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                 totalResults:
 *                   type: integer
 *                   description: Total number of results
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
academyProgramRouter
  .route('/')
  .get(checkJWT, academyProgramController.getPrograms);

/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: Get program by ID
 *     description: Fetch a program's details by its ID.
 *     tags: [Academy Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the program to fetch
 *     responses:
 *       200:
 *         description: Program details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 type:
 *                   type: string
 *                 duration:
 *                   type: string
 *                 price:
 *                   type: number
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 studentSubscriptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       status:
 *                         type: string
 *                       student:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                 cartItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       status:
 *                         type: string
 *                 studentProgramCredits:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       creditAmount:
 *                         type: number
 *                       expiryDate:
 *                         type: string
 *                         format: date-time
 *                       student:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Program not found
 */
academyProgramRouter
  .route('/:id')
  .get(checkJWT, academyProgramController.getProgram);

/**
 * @swagger
 * /{id}:
 *   put:
 *     summary: Update program by ID
 *     description: Update a program's details by its ID.
 *     tags: [Academy Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the program to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the program
 *               type:
 *                 type: string
 *                 description: Type of the program
 *               seasonPrice:
 *                 type: number
 *                 description: Seasonal price of the program
 *               monthlyPrice:
 *                 type: number
 *                 description: Monthly price of the program
 *               yearlyDiscountPercentage:
 *                 type: number
 *                 description: Yearly discount percentage
 *               description:
 *                 type: string
 *                 description: Description of the program
 *               discountRules:
 *                 type: object
 *                 description: Discount rules for the program
 *               discountAmount:
 *                 type: number
 *                 description: Discount amount for the program
 *               latePaymentFees:
 *                 type: number
 *                 description: Late payment fees for the program
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Due date for payments
 *     responses:
 *       200:
 *         description: Program updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 type:
 *                   type: string
 *                 seasonPrice:
 *                   type: number
 *                 monthlyPrice:
 *                   type: number
 *                 yearlyDiscountPercentage:
 *                   type: number
 *                 description:
 *                   type: string
 *                 discountRules:
 *                   type: object
 *                 discountAmount:
 *                   type: number
 *                 latePaymentFees:
 *                   type: number
 *                 dueDate:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Program not found
 */
academyProgramRouter
  .route('/:id')
  .put(checkJWT, academyProgramController.updateProgram);

/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: Delete program by ID
 *     description: Delete a program by its ID.
 *     tags: [Academy Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the program to delete
 *     responses:
 *       200:
 *         description: Program deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 type:
 *                   type: string
 *                 duration:
 *                   type: string
 *                 price:
 *                   type: number
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
 *       404:
 *         description: Program not found
 */
academyProgramRouter
  .route('/:id')
  .delete(checkJWT, academyProgramController.deleteProgram);

module.exports = academyProgramRouter;
