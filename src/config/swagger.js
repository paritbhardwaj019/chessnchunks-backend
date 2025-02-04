const swaggerAutogen = require('swagger-autogen')();
const path = require('path');

const doc = {
  info: {
    title: 'Chess in Chunks API',
    version: '1.0.0',
    description: `
      Chess in Chunks - A Modern Chess Learning Platform
      
      This API provides endpoints for:
      - User authentication and authorization
      - Chess game management
      - Learning modules and progress tracking
      - Super admin controls
      - Real-time game interactions via Socket.IO
    `,
    contact: {
      name: 'API Support',
      email: 'support@chessinchunks.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  host:
    process.env.NODE_ENV === 'production'
      ? 'api.chessinchunks.com'
      : 'localhost:5000',
  schemes: ['http', 'https'],
  securityDefinitions: {
    xAuthToken: {
      type: 'apiKey',
      name: 'x-auth-token',
      in: 'header',
      description: 'Enter your JWT token in the format: <token>',
    },
  },
};

const outputFile = path.resolve(__dirname, '../swagger-output.json');
const endpointsFiles = [path.resolve(__dirname, '../routes/v1/*.js')];

swaggerAutogen(outputFile, endpointsFiles, doc);
