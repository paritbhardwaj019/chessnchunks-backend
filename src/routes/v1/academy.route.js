const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const academyController = require('../../controllers/academy.controller');

const academyRouter = express.Router();

academyRouter
  .route('/:id')
  .put(
    checkJWT,
    checkRole(['SUPER_ADMIN', 'ADMIN']),
    academyController.updateAcademyByIdHandler
  );

module.exports = academyRouter;
