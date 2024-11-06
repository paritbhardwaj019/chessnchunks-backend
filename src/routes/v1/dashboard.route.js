const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const dashboardController = require('../../controllers/dashboard.controller');
const checkPermission = require('../../middlewares/checkPermission');

const dashboardRouter = express.Router();

dashboardRouter
  .route('/')
  .get(
    checkJWT,
    checkPermission('view', '/dashboard'),
    dashboardController.fetchAllDashboard
  );

module.exports = dashboardRouter;
