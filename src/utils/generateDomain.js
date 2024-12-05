const config = require('../config');

const generateDomain = (academyName) => {
  const frontendUrlWithoutProtocol = config.frontendUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

  const sanitizedAcademyName = academyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  return `http://${sanitizedAcademyName}.${frontendUrlWithoutProtocol}`;
};

module.exports = generateDomain;
