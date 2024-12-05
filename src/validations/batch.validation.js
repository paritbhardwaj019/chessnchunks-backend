const Joi = require('joi');

const createBatch = {
  body: Joi.object().keys({
    description: Joi.string().allow('', null),
    studentCapacity: Joi.number().required().min(1),
    warningCutoff: Joi.number().required().min(1),
    currentClass: Joi.string().required(),
    startLevel: Joi.string().required(),
    currentLevel: Joi.string().required(),
    batchDay: Joi.string()
      .required()
      .valid(
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ),
    startTime: Joi.date().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().allow(null),
    academyId: Joi.string().uuid(),
    coaches: Joi.array().items(Joi.string().uuid()).min(1).required(),
    students: Joi.array().items(Joi.string().uuid()).default([]),
  }),
};

const updateBatch = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object()
    .keys({
      description: Joi.string().allow('', null),
      studentCapacity: Joi.number().min(1),
      warningCutoff: Joi.number().min(1),
      currentClass: Joi.string(),
      startLevel: Joi.string(),
      currentLevel: Joi.string(),
      batchDay: Joi.string().valid(
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ),
      startTime: Joi.date(),
      startDate: Joi.date(),
      endDate: Joi.date().allow(null),
      coaches: Joi.array().items(Joi.string().uuid()).min(1),
      students: Joi.array().items(Joi.string().uuid()),
    })
    .min(1)
    .required(),
};

const deleteBatch = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required(),
  }),
};

const getBatch = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required(),
  }),
};

const getBatches = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1),
    query: Joi.string(),
  }),
};

module.exports = {
  createBatch,
  updateBatch,
  deleteBatch,
  getBatch,
  getBatches,
};
