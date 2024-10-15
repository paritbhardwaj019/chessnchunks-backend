const httpStatus = require('http-status');
const taskService = require('../services/task.service');
const catchAsync = require('../utils/catchAsync');

const createTask = catchAsync(async (req, res) => {
    const task = await taskService.createTaskHandler(req.body);
    res.status(httpStatus.CREATED).send(task);
  });

const getAllTasks = catchAsync(async (req, res) => {
  const tasks = await taskService.getAllTasks(req.user);
  res.status(httpStatus.OK).send(tasks);
});

const getTaskById = catchAsync(async (req, res) => {
  const task = await taskService.getTaskById(req.params.taskId, req.user);
  res.status(httpStatus.OK).send(task);
});

const updateTask = catchAsync(async (req, res) => {
  const task = await taskService.updateTask(req.params.taskId, req.body, req.user);
  res.status(httpStatus.OK).send(task);
});

const deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTask(req.params.taskId, req.user);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
