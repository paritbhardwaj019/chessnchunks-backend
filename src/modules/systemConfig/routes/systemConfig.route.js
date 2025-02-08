const express = require('express');
const systemConfigController = require('../controllers/systemConfig.controller');
const checkJWT = require('../../../middlewares/checkJWT');
const checkPermission = require('../../../middlewares/checkPermission');

const systemConfigRouter = express.Router();

systemConfigRouter.get(
  '/options',
  checkJWT,
  checkPermission('view', '/dashboard/system-config'),
  systemConfigController.getSystemConfigOptionsByTypeHandler
);

systemConfigRouter.post(
  '/',
  checkJWT,
  checkPermission('add', '/dashboard/system-config'),
  systemConfigController.createSystemConfigHandler
);

systemConfigRouter.get(
  '/',
  checkJWT,
  checkPermission('view', '/dashboard/system-config'),
  systemConfigController.getAllSystemConfigsHandler
);

systemConfigRouter.get(
  '/:id',
  checkJWT,
  checkPermission('view', '/dashboard/system-config'),
  systemConfigController.getSystemConfigByIdHandler
);

systemConfigRouter.put(
  '/:id',
  checkJWT,
  checkPermission('update', '/dashboard/system-config'),
  systemConfigController.updateSystemConfigHandler
);

systemConfigRouter.delete(
  '/:id',
  checkJWT,
  checkPermission('delete', '/dashboard/system-config'),
  systemConfigController.deleteSystemConfigHandler
);

module.exports = systemConfigRouter;
