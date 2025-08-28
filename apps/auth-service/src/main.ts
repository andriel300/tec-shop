import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  // Initializes the core application using the root module, which defines
  // the controllers, providers, and overall structure of this service.
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';

  // Configures Cross-Origin Resource Sharing (CORS) to explicitly allow
  // requests only from the frontend application running locally. This is
  // essential for secure communication between the frontend and this service
  // during development, especially when dealing with authentication cookies.
  app.enableCors({
    origin: ["http://localhost:3000"], // Your frontend dev auth server
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  // Prepends '/api' to all route paths, effectively namespacing all endpoints.
  // This helps differentiate API routes from other server-side routes and is
  // a common practice for API versioning and organization.
  app.setGlobalPrefix(globalPrefix);

  const port = process.env.PORT || 6001;

  // Starts the application and begins listening for incoming requests on the specified port.
  await app.listen(port);

  Logger.log(`🚀 Auth service is running on: http://localhost:${port}/${globalPrefix}`);
}

// Kicks off the entire process. This is the entry point that starts the NestJS application.
bootstrap();
