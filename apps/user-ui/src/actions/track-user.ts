'use server';

import { createLogger } from '@tec-shop/next-logger';

const logger = createLogger('user-ui:analytics');

/**
 * Send analytics event to the API Gateway
 * The API Gateway will produce the event to Kafka/Redpanda
 */
export async function sendKafkaEvent(eventData: {
  userId: string;
  productId?: string;
  shopId?: string;
  action: string;
  device?: string;
  country?: string;
  city?: string;
}) {
  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

    const response = await fetch(`${backendUrl}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: eventData.userId,
        productId: eventData.productId,
        shopId: eventData.shopId,
        action: eventData.action,
        country: eventData.country,
        city: eventData.city,
        device: eventData.device,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to track event: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // Log error but don't throw - analytics failures shouldn't break user experience
    logger.error({ err: error }, 'Failed to send analytics event');
    return { success: false };
  }
}
