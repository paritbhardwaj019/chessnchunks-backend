const httpStatus = require('http-status');
const systemCodeService = require('../services/systemCode.service');

const createSystemCode = async (req, res) => {
  const systemCode = await systemCodeService.createSystemCode(req.body);
  res.status(httpStatus.CREATED).json(systemCode);
};

const updateSystemCode = async (req, res) => {
  const systemCode = await systemCodeService.updateSystemCode(
    req.params.id,
    req.body
  );
  res.json(systemCode);
};

const getAllSystemCodes = async (req, res) => {
  const systemCodes = await systemCodeService.getAllSystemCodes();
  res.json(systemCodes);
};

const systemCodeController = {
  createSystemCode,
  updateSystemCode,
  getAllSystemCodes,
};

module.exports = systemCodeController;
