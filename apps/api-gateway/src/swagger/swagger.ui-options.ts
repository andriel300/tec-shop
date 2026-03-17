import { SwaggerCustomOptions } from '@nestjs/swagger';

const SWAGGER_CUSTOM_CSS = `
  .swagger-ui .topbar { display: none }
  .swagger-ui .info { margin: 50px 0 }
  .swagger-ui .info .title { font-size: 36px }
`;

export const swaggerUiOptions: SwaggerCustomOptions = {
  customSiteTitle: 'TecShop API Documentation',
  customfavIcon: 'https://tecshop.com/favicon.ico',
  customCss: SWAGGER_CUSTOM_CSS,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
};
