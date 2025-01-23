const express = require('express');
const studentSignupController = require('../controllers/studentSignup.controller');
const checkJWT = require('../../../middlewares/checkJWT');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Student Signups
 *   description: Endpoints for managing student signups, MFA, and program purchases
 */

/**
 * @swagger
 * /student-signups/{id}/verify-mfa:
 *   post:
 *     summary: Verify MFA for a student signup
 *     description: Verify the Multi-Factor Authentication (MFA) for a student signup using the OTP sent to their email.
 *     tags: [Student Signups]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the student signup
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: The OTP sent to the student's email
 *     responses:
 *       200:
 *         description: MFA verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verified:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid OTP or MFA not enabled
 *       404:
 *         description: Signup not found
 */
router.post('/:id/verify-mfa', studentSignupController.verifyMFAHandler);

/**
 * @swagger
 * /student-signups/{id}/setup-mfa:
 *   post:
 *     summary: Setup MFA for a student signup
 *     description: Initiate the setup of Multi-Factor Authentication (MFA) for a student signup.
 *     tags: [Student Signups]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the student signup
 *     responses:
 *       200:
 *         description: MFA setup initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Signup not found
 */
router.route('/:id/setup-mfa').post(studentSignupController.setupMFAHandler);

/**
 * @swagger
 * /student-signups:
 *   post:
 *     summary: Create a new student signup
 *     description: Create a new student signup for an academy.
 *     tags: [Student Signups]
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
 *                 description: The email address of the student
 *               firstName:
 *                 type: string
 *                 description: The first name of the student
 *               middleName:
 *                 type: string
 *                 description: The middle name of the student
 *               lastName:
 *                 type: string
 *                 description: The last name of the student
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: The date of birth of the student
 *               parentName:
 *                 type: string
 *                 description: The name of the student's parent
 *               parentEmail:
 *                 type: string
 *                 format: email
 *                 description: The email address of the student's parent
 *               phoneNumber:
 *                 type: string
 *                 description: The phone number of the student
 *               addressLine1:
 *                 type: string
 *                 description: The address line 1 of the student
 *               addressLine2:
 *                 type: string
 *                 description: The address line 2 of the student
 *               city:
 *                 type: string
 *                 description: The city of the student
 *               state:
 *                 type: string
 *                 description: The state of the student
 *               country:
 *                 type: string
 *                 description: The country of the student
 *               zipCode:
 *                 type: string
 *                 description: The zip code of the student
 *               batchInterestId:
 *                 type: string
 *                 description: The ID of the batch the student is interested in
 *               chessComId:
 *                 type: string
 *                 description: The Chess.com ID of the student
 *               lichessId:
 *                 type: string
 *                 description: The Lichess ID of the student
 *               uscfId:
 *                 type: string
 *                 description: The USCF ID of the student
 *     responses:
 *       201:
 *         description: Student signup created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 signupId:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 middleName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 dateOfBirth:
 *                   type: string
 *                   format: date
 *                 parentName:
 *                   type: string
 *                 parentEmail:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *                 addressLine1:
 *                   type: string
 *                 addressLine2:
 *                   type: string
 *                 city:
 *                   type: string
 *                 state:
 *                   type: string
 *                 country:
 *                   type: string
 *                 zipCode:
 *                   type: string
 *                 chessComId:
 *                   type: string
 *                 lichessId:
 *                   type: string
 *                 uscfId:
 *                   type: string
 *                 signupStage:
 *                   type: string
 *                 signupStatus:
 *                   type: string
 *                 interestedBatch:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     batchCode:
 *                       type: string
 *                 academy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 reservationExpiry:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input or email already registered
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: Batch not found or Chess.com username invalid
 */
router
  .route('/')
  .post(checkJWT, studentSignupController.createSignupHandler)
  .get(checkJWT, studentSignupController.fetchAllSignups);

/**
 * @swagger
 * /student-signups/{id}:
 *   get:
 *     summary: Fetch a student signup by ID
 *     description: Retrieve details of a student signup by its ID.
 *     tags: [Student Signups]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the student signup
 *     responses:
 *       200:
 *         description: Student signup retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 signupId:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 middleName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 dateOfBirth:
 *                   type: string
 *                   format: date
 *                 parentName:
 *                   type: string
 *                 parentEmail:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *                 addressLine1:
 *                   type: string
 *                 addressLine2:
 *                   type: string
 *                 city:
 *                   type: string
 *                 state:
 *                   type: string
 *                 country:
 *                   type: string
 *                 zipCode:
 *                   type: string
 *                 chessComId:
 *                   type: string
 *                 lichessId:
 *                   type: string
 *                 uscfId:
 *                   type: string
 *                 signupStage:
 *                   type: string
 *                 signupStatus:
 *                   type: string
 *                 interestedBatch:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     batchCode:
 *                       type: string
 *                 academy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 reservationExpiry:
 *                   type: string
 *                   format: date-time
 *                 otp:
 *                   type: string
 *       404:
 *         description: Signup not found
 */
router.route('/:id').get(studentSignupController.fetchSignupById);

/**
 * @swagger
 * /student-signups/{id}:
 *   put:
 *     summary: Update a student signup
 *     description: Update details of a student signup by its ID.
 *     tags: [Student Signups]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the student signup
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
 *               firstName:
 *                 type: string
 *               middleName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               parentName:
 *                 type: string
 *               parentEmail:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *               addressLine1:
 *                 type: string
 *               addressLine2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               batchInterestId:
 *                 type: string
 *               chessComId:
 *                 type: string
 *               lichessId:
 *                 type: string
 *               uscfId:
 *                 type: string
 *               mfaEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Student signup updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 signupId:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 middleName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 dateOfBirth:
 *                   type: string
 *                   format: date
 *                 parentName:
 *                   type: string
 *                 parentEmail:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *                 addressLine1:
 *                   type: string
 *                 addressLine2:
 *                   type: string
 *                 city:
 *                   type: string
 *                 state:
 *                   type: string
 *                 country:
 *                   type: string
 *                 zipCode:
 *                   type: string
 *                 chessComId:
 *                   type: string
 *                 lichessId:
 *                   type: string
 *                 uscfId:
 *                   type: string
 *                 signupStage:
 *                   type: string
 *                 signupStatus:
 *                   type: string
 *                 interestedBatch:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     batchCode:
 *                       type: string
 *                 academy:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 reservationExpiry:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input or MFA setup failed
 *       404:
 *         description: Signup not found
 */
router.route('/:id').put(studentSignupController.updateSignupHandler);

/**
 * @swagger
 * /student-signups/{id}/verify-email:
 *   post:
 *     summary: Verify a student's email
 *     description: Verify the email address of a student signup.
 *     tags: [Student Signups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the student signup
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 emailVerified:
 *                   type: boolean
 *                 emailVerifiedAt:
 *                   type: string
 *                   format: date-time
 *                 signupStage:
 *                   type: string
 *       404:
 *         description: Signup not found
 */
router
  .route('/:id/verify-email')
  .post(checkJWT, studentSignupController.verifyEmailHandler);

/**
 * @swagger
 * /student-signups/{id}/reserve:
 *   post:
 *     summary: Reserve a student signup
 *     description: Reserve a student signup for a specific period.
 *     tags: [Student Signups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the student signup
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiryHours:
 *                 type: number
 *                 description: The number of hours to reserve the signup for
 *     responses:
 *       200:
 *         description: Signup reserved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 signupStatus:
 *                   type: string
 *                 reservationTime:
 *                   type: string
 *                   format: date-time
 *                 reservationExpiry:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Signup not found
 */
router
  .route('/:id/reserve')
  .post(checkJWT, studentSignupController.setReservationHandler);

/**
 * @swagger
 * /student-signups/{id}/confirm:
 *   post:
 *     summary: Confirm a student signup
 *     description: Confirm a student signup and associate it with a user.
 *     tags: [Student Signups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the student signup
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user to associate with the signup
 *     responses:
 *       200:
 *         description: Signup confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 signupStatus:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 signupStage:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Signup not found
 */
router
  .route('/:id/confirm')
  .post(checkJWT, studentSignupController.confirmSignupHandler);

/**
 * @swagger
 * /student-signups/batch/{batchId}/waitlist:
 *   get:
 *     summary: Fetch the waitlist for a batch
 *     description: Retrieve the list of students on the waitlist for a specific batch.
 *     tags: [Student Signups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the batch
 *     responses:
 *       200:
 *         description: Waitlist retrieved successfully
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
 *                   signupId:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   middleName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *                   parentName:
 *                     type: string
 *                   parentEmail:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   addressLine1:
 *                     type: string
 *                   addressLine2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   chessComId:
 *                     type: string
 *                   lichessId:
 *                     type: string
 *                   uscfId:
 *                     type: string
 *                   signupStage:
 *                     type: string
 *                   signupStatus:
 *                     type: string
 *                   interestedBatch:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       batchCode:
 *                         type: string
 *                   academy:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                   reservationExpiry:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: Batch not found
 */
router
  .route('/batch/:batchId/waitlist')
  .get(checkJWT, studentSignupController.handleWaitlistHandler);

/**
 * @swagger
 * /student-signups/program/purchase:
 *   post:
 *     summary: Add a program purchase to the cart
 *     description: Add a program purchase to the student's cart.
 *     tags: [Student Signups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               programId:
 *                 type: string
 *                 description: The ID of the program to purchase
 *               appliedCredit:
 *                 type: number
 *                 description: The amount of credit applied to the purchase
 *               appliedDiscount:
 *                 type: number
 *                 description: The amount of discount applied to the purchase
 *               academyId:
 *                 type: string
 *                 description: The ID of the academy offering the program
 *     responses:
 *       201:
 *         description: Program purchase added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 programId:
 *                   type: string
 *                 appliedCredit:
 *                   type: number
 *                 appliedDiscount:
 *                   type: number
 *                 finalPrice:
 *                   type: number
 *                 status:
 *                   type: string
 *                 program:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     price:
 *                       type: number
 *                 user:
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
 *       400:
 *         description: Invalid input or program not found
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
router
  .route('/program/purchase')
  .post(checkJWT, studentSignupController.addProgramPurchase);

/**
 * @swagger
 * /student-signups/checkout:
 *   post:
 *     summary: Create a checkout session for a program
 *     description: Create a Stripe checkout session for a program purchase.
 *     tags: [Student Signups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               programId:
 *                 type: string
 *                 description: The ID of the program to purchase
 *               userEmail:
 *                 type: string
 *                 format: email
 *                 description: The email address of the user
 *               billingPeriod:
 *                 type: string
 *                 enum: [monthly, seasonal, yearly]
 *                 description: The billing period for the program
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 sessionUrl:
 *                   type: string
 *       400:
 *         description: Invalid input or program not found
 */
router.route('/checkout').post(studentSignupController.checkoutSession);

/**
 * @swagger
 * /student-signups/credits:
 *   get:
 *     summary: Fetch program credits for a student
 *     description: Retrieve the list of program credits available for a student.
 *     tags: [Student Signups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Program credits retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   programId:
 *                     type: string
 *                   isRedeemed:
 *                     type: boolean
 *                   program:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
router
  .route('/credits')
  .get(checkJWT, studentSignupController.getProgramCredits);

/**
 * @swagger
 * /student-signups/subscriptions:
 *   get:
 *     summary: Fetch active subscriptions for a student
 *     description: Retrieve the list of active subscriptions for a student.
 *     tags: [Student Signups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active subscriptions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   status:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                   academyPlan:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */
router
  .route('/subscriptions')
  .get(checkJWT, studentSignupController.getActiveSubscriptions);

/**
 * @swagger
 * /student-signups/{id}/update-password:
 *   put:
 *     summary: Update a student's password
 *     description: Update the password for a student signup.
 *     tags: [Student Signups]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the student signup
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: The new password
 *               cicId:
 *                 type: string
 *                 description: The CIC ID of the student
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input or password too short
 *       404:
 *         description: Signup not found
 */
router
  .route('/:id/update-password')
  .put(studentSignupController.updatePasswordHandler);

module.exports = router;
