const httpStatus = require('http-status');
const db = require('../database/prisma');
const ApiError = require('../utils/apiError');
const createToken = require('../utils/createToken');
const logger = require('../utils/logger');

const adminService = {};

module.exports = adminService;
