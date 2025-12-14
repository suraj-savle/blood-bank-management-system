import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// swagger config
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BBMS',
      version: 'rolling',
      description: 'Blood Bank Management System (BBMS) RESTful api',
    },
  },
  apis: ['./openapi/*.js'],
};

// setup 
const swaggerDocs = swaggerJsDoc(swaggerOptions);

export {
  swaggerDocs,
  swaggerUi
}
