const express = require('express');
const checkJWT = require('../../../middlewares/checkJWT');
const academyGoalsController = require('../controllers/academyGoalsReport.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Academy Goals Report
 *   description: Endpoints for managing academy chess goals reports
 */

/**
 * @swagger
 * /reports/academy/chess-goals:
 *   get:
 *     summary: Get academy chess goals report
 *     description: Fetch a report of chess goals for all students in an academy, including rapid ratings, puzzle stats, and puzzle rush scores.
 *     tags: [Academy Goals Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academyId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the academy to fetch the report for
 *       - in: query
 *         name: filters[type]
 *         schema:
 *           type: string
 *           enum: [All, Games, Puzzles, Puzzle Rushes]
 *         description: Filter the report by type (All, Games, Puzzles, Puzzle Rushes)
 *       - in: query
 *         name: filters[view]
 *         schema:
 *           type: string
 *           enum: [Both, Goals, Progress]
 *         description: Filter the report by view (Both, Goals, Progress)
 *     responses:
 *       200:
 *         description: Academy chess goals report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 students:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       batchCode:
 *                         type: string
 *                         description: Batch code of the student
 *                       studentName:
 *                         type: string
 *                         description: Full name of the student
 *                       chessComId:
 *                         type: string
 *                         description: Chess.com ID of the student
 *                       rapidGoal:
 *                         type: object
 *                         properties:
 *                           weeklyGames:
 *                             type: number
 *                             description: Number of rapid games played in the last week
 *                           rating:
 *                             type: object
 *                             properties:
 *                               current:
 *                                 type: number
 *                                 description: Current rapid rating
 *                               high:
 *                                 type: number
 *                                 description: High rapid rating goal
 *                               mid:
 *                                 type: number
 *                                 description: Mid rapid rating goal
 *                               low:
 *                                 type: number
 *                                 description: Low rapid rating goal
 *                           accuracy:
 *                             type: number
 *                             description: Average accuracy of rapid games
 *                       puzzleGoal:
 *                         type: object
 *                         properties:
 *                           weeklyCount:
 *                             type: number
 *                             description: Number of puzzles solved in the last week
 *                           rating:
 *                             type: object
 *                             properties:
 *                               current:
 *                                 type: number
 *                                 description: Current puzzle rating
 *                               high:
 *                                 type: number
 *                                 description: High puzzle rating goal
 *                               floor:
 *                                 type: number
 *                                 description: Puzzle rating floor
 *                       puzzleRush:
 *                         type: object
 *                         properties:
 *                           weeklyAttempts:
 *                             type: number
 *                             description: Number of puzzle rush attempts in the last week
 *                           scores:
 *                             type: object
 *                             properties:
 *                               high:
 *                                 type: number
 *                                 description: Highest puzzle rush score
 *                               recent:
 *                                 type: number
 *                                 description: Most recent puzzle rush score
 *                       passRates:
 *                         type: object
 *                         properties:
 *                           standard:
 *                             type: number
 *                             description: Standard pass rate
 *                           rating:
 *                             type: number
 *                             description: Rating pass rate
 *                       error:
 *                         type: string
 *                         description: Error message if fetching stats failed
 *                 filters:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       description: Type filter applied (All, Games, Puzzles, Puzzle Rushes)
 *                     view:
 *                       type: string
 *                       description: View filter applied (Both, Goals, Progress)
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       404:
 *         description: No students found in the academy
 *       500:
 *         description: Internal server error
 */
router
  .route('/reports/academy/chess-goals')
  .get(checkJWT, academyGoalsController.getAcademyGoalsReport);

module.exports = router;
