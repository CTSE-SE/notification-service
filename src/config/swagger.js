const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notification Service API',
      version: '1.0.0',
      description: 'ShopApp Notification Microservice API Documentation',
    },
    servers: [
      {
        url: 'http://shopapp-alb-1013507396.ap-southeast-1.elb.amazonaws.com',
        description: 'AWS Production',
      },
      {
        url: 'http://localhost:3001',
        description: 'Local Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
