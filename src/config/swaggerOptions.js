const path = require('path');

const config = require('.'); // Assuming this imports your configuration

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Chess in Chunks API',
      version: '1.0.0',
      description: `
        API documentation for the **Chess in Chunks** project. 
        This API provides endpoints for managing chess games, players, and game states in a modular and scalable way.
        Key features include:
        - Creating and managing chess games.
        - Tracking player moves and game progress.
        - Fetching game history and analytics.
        - Real-time updates for ongoing games.

        This API is designed to support the **Chess in Chunks** platform, enabling seamless integration with frontend applications and third-party services.

        **Authentication**: 
        - Use the \`x-auth-token\` header to provide your JWT token for authenticated routes.
        - Example: \`x-auth-token: {token}\`
      `,
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        xAuthToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-auth-token',
          description:
            'JWT token for authentication. Example: `x-auth-token: {token}`',
        },
      },
    },
    security: [
      {
        xAuthToken: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description:
          'Endpoints related to user authentication and authorization',
      },
    ],
  },
  apis: [path.join(__dirname, '../routes/v1/*.js')],
};

module.exports = swaggerOptions;
