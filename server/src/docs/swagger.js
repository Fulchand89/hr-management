const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const setupSwagger = (app) => {
  // Serve raw JSON spec for Postman / Swagger Codegen / Mobile developers
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });

  // Serve interactive Swagger UI
  const options = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'HRMS API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true
    }
  };

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));
};

module.exports = {
  setupSwagger,
  swaggerDocument
};
