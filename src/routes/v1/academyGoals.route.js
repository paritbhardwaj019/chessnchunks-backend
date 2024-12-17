const express = require('express');
const academyGoalsController = require('../../controllers/academyGoalsReport.controller');
const checkJWT = require('../../middlewares/checkJWT');

const router = express.Router();

router
  .route('/reports/academy/chess-goals')
  .get(checkJWT, academyGoalsController.getAcademyGoalsReport);

module.exports = router;
