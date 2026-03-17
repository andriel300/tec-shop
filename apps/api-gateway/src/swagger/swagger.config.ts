import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { SWAGGER_DESCRIPTION } from './swagger.description';

export interface SwaggerTag {
  name: string;
  description: string;
}

export const SWAGGER_TAGS: SwaggerTag[] = [
  // Auth & identity
  { name: 'Auth', description: 'Authentication and authorization endpoints' },
  { name: 'User', description: 'Customer profile management' },
  { name: 'Seller', description: 'Seller account and shop operations' },
  { name: 'Admin', description: 'Platform administration — restricted to ADMIN role' },

  // Catalog
  { name: 'Products', description: 'Product catalog management' },
  { name: 'Categories', description: 'Product category hierarchy' },
  { name: 'Brands', description: 'Brand directory management' },
  { name: 'Discounts', description: 'Discount and promotion management' },
  { name: 'Events', description: 'Shop events and scheduled promotions' },

  // Commerce
  { name: 'Orders', description: 'Order lifecycle and Stripe Checkout' },
  { name: 'Stripe Connect', description: 'Stripe payment integration for sellers' },
  { name: 'Webhooks', description: 'External service webhooks' },

  // Real-time
  { name: 'Chat', description: 'Buyer-seller real-time messaging' },
  { name: 'Notifications', description: 'Admin notification management' },
  { name: 'User Notifications', description: 'Per-user notification inbox' },

  // Discovery
  { name: 'Public Products', description: 'Unauthenticated product browsing and search' },
  { name: 'Public Shops', description: 'Unauthenticated shop browsing and follow' },
  { name: 'Public - Categories', description: 'Unauthenticated category listing' },
  { name: 'Public - Layout', description: 'Storefront layout and hero slides' },
  { name: 'Recommendations', description: 'ML-powered product recommendations' },

  // Intelligence & ops
  { name: 'Analytics', description: 'User interaction event tracking' },
  { name: 'Logs', description: 'Centralized structured log access — ADMIN only' },
  { name: 'Health Check', description: 'API gateway liveness probe' },
];

export function buildSwaggerConfig(): Omit<OpenAPIObject, 'paths'> {
  const builder = new DocumentBuilder()
    .setTitle('TecShop API Gateway')
    .setDescription(SWAGGER_DESCRIPTION)
    .setVersion('1.0.0')
    .setContact(
      'TecShop Development',
      'https://github.com/andriel300/tec-shop',
      'support@tecshop.com',
    )
    .setLicense('MIT', 'https://github.com/andriel300/tec-shop/blob/main/LICENSE')
    .addServer('http://localhost:8080', 'Development Server')
    .addServer('https://api.tecshop.com', 'Production Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    );

  SWAGGER_TAGS.forEach(({ name, description }) => builder.addTag(name, description));

  return builder.build();
}
