const express = require('express');
const academyProgramController = require('../../controllers/academyProgram.controller');
const checkJWT = require('../../middlewares/checkJWT');

const academyProgramRouter = express.Router();

academyProgramRouter.get(
  '/academy/:academyId',
  academyProgramController.getAcademyPrograms
);

academyProgramRouter.get(
  '/options',
  checkJWT,
  academyProgramController.getProgramOptions
);

academyProgramRouter.get(
  '/:id/subscribers',
  checkJWT,
  academyProgramController.getProgramSubscribers
);

academyProgramRouter.put(
  '/:id/credits',
  checkJWT,
  academyProgramController.updateProgramCredits
);

academyProgramRouter
  .route('/')
  .post(checkJWT, academyProgramController.createProgram)
  .get(checkJWT, academyProgramController.getPrograms);

academyProgramRouter
  .route('/:id')
  .get(checkJWT, academyProgramController.getProgram)
  .put(checkJWT, academyProgramController.updateProgram)
  .delete(checkJWT, academyProgramController.deleteProgram);

module.exports = academyProgramRouter;
