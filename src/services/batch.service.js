const createBatchHandler = async (data) => {
  const { studentCapacity, description } = data;
  const { role, subRole, id } = req.user;

  return {};
};

const updateBatchHandler = async (id, data) => {
  return {};
};

const deleteBatchHandler = async (id) => {
  return {};
};

const fetchAllBatches = async () => {
  return [];
};

const batchService = {
  createBatchHandler,
  updateBatchHandler,
  deleteBatchHandler,
  fetchAllBatches,
};

module.exports = batchService;
