const express = require('express');
const taskController = require('../../controllers/task.controller');
const checkJWT = require('../../middlewares/checkJWT');
const checkRole = require('../../middlewares/checkRole');
const checkPermission = require('../../middlewares/checkPermission');

const taskRouter = express.Router();

taskRouter.post(
  '/',
  checkJWT,
  checkPermission('add', '/dashboard/tasks/puzzles'),
  taskController.createTask
);

taskRouter.get(
  '/',
  checkJWT,
  checkPermission('view', '/dashboard/tasks/puzzles'),
  taskController.getAllTasks
);

taskRouter.get('/:taskId', taskController.getTaskById);

taskRouter.put(
  '/:taskId',
  checkPermission('update', '/dashboard/tasks/puzzles'),
  taskController.updateTask
);

taskRouter.delete(
  '/:taskId',
  checkPermission('delete', '/dashboard/tasks/puzzles'),
  taskController.deleteTask
);

module.exports = taskRouter;
