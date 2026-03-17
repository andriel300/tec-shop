import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { buildSwaggerConfig } from './swagger.config';
import { swaggerUiOptions } from './swagger.ui-options';

export function setupSwagger(app: INestApplication): void {
  const config = buildSwaggerConfig();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, swaggerUiOptions);
}
