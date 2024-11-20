const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pension Management System API',
      version: '1.0.0',
      description: 'API documentation for the Pension Management System',
      contact: {
        name: 'API Support',
        email: 'support@pensionmanagementsystem.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    './src/routes/*.js',
    './src/models/*.js'
  ]
};

module.exports = swaggerJsdoc(options);
