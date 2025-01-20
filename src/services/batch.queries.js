const httpStatus = require('http-status');

const ApiError = require('../utils/apiError');

const getBatchFilter = (loggedInUser, query = null) => {
  const filter = {};

  if (loggedInUser.role === 'ADMIN') {
    filter.academy = {
      admins: { some: { id: loggedInUser.id } },
    };
  } else if (loggedInUser.role === 'COACH') {
    filter.coaches = { some: { id: loggedInUser.id } };
  }

  if (query) {
    filter.batchCode = { contains: query };
  }

  return filter;
};

const getBatchById = async (db, id) => {
  return db.batch.findUnique({
    where: { id },
    include: {
      students: true,
      coaches: true,
      academy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

module.exports = {
  getBatchFilter,
  getBatchById,
};
