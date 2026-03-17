import { initializeSentry } from '@tec-shop/sentry';

export function initializeSentryForService(serviceName: string): void {
  initializeSentry({ serviceName, transport: 'Kafka' });
}
