const express = require('express');
const systemCodeController = require('../../controllers/systemCode.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkPermission = require('../../middlewares/checkPermission');

const router = express.Router();

router
  .route('/')
  .post(
    checkJWT,
    checkPermission('add', '/dashboard/system-code'),
    systemCodeController.createSystemCode
  )
  .get(
    checkJWT,
    checkPermission('view', '/dashboard/system-code'),
    systemCodeController.getAllSystemCodes
  );

router
  .route('/:id')
  .patch(
    checkJWT,
    checkPermission('update', '/dashboard/system-code'),
    systemCodeController.updateSystemCode
  );

module.exports = router;
