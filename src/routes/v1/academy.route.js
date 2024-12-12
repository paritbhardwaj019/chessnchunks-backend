const express = require('express');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const academyController = require('../../controllers/academy.controller');

const academyRouter = express.Router();

academyRouter
  .route('/:id')
  .put(
    checkJWT,
    checkRole(['SUPER_ADMIN']),
    academyController.updateAcademyByIdHandler
  )
  .get(
    checkJWT,
    checkRole(['SUPER_ADMIN']),
    academyController.fetchAcademyByIdHandler
  );

academyRouter
  .route('/domain/:domain')
  .get(academyController.getAcademyByDomain);

academyRouter
  .route('/domain/:domain/pages/:slug')
  .get(academyController.getPublicPageBySlug);

academyRouter
  .route('/domain/:domain/pages/:pageId/components/:componentId')
  .put(
    checkJWT,
    checkRole(['SUPER_ADMIN', 'ADMIN']),
    academyController.updateComponentById
  );

module.exports = academyRouter;
