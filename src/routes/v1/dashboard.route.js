const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const dashboardController = require('../../controllers/dashboard.controller');

const dashboardRouter = express.Router();

dashboardRouter
  .route('/')
  .get(
    checkJWT,
    checkRole(['SUPER_ADMIN', 'ADMIN', 'COACH']),
    dashboardController.fetchAllData
  );

module.exports = dashboardRouter;
