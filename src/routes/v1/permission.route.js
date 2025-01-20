const express = require('express');

const permissionController = require('../../controllers/permission.controller');
const checkJWT = require('../../middlewares/checkJWT');

const permissionRouter = express.Router();

permissionRouter.get('/roles', checkJWT, permissionController.fetchAllRoles);

permissionRouter
  .route('/')
  .get(checkJWT, permissionController.fetchUserPermission)
  .put(checkJWT, permissionController.updatePermission);

module.exports = permissionRouter;
