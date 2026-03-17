import { initializeSentry } from '@tec-shop/sentry';

export function initializeSentryForService(): void {
  initializeSentry({
    serviceName: 'api-gateway',
    port: process.env['PORT'] ?? '8080',
    transport: 'HTTP',
  });
}
