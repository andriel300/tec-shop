import { initializeSentry } from '@tec-shop/sentry';

export function initializeSentryForService(serviceName: string, port: string | number): void {
  initializeSentry({ serviceName, port, transport: 'HTTP+WebSocket' });
}
