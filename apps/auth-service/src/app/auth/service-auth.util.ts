import { createHmac } from 'crypto';

export interface SignedRequest {
  payload: Record<string, unknown>;
  signature: string;
  timestamp: number;
  serviceId: string;
}

export class ServiceAuthUtil {
  private static readonly REQUEST_TTL = 300; // 5 minutes

  /**
   * Sign a request payload for inter-service communication
   */
  static signRequest(payload: Record<string, unknown>, serviceId: string, secretKey: string): SignedRequest {
    const timestamp = Math.floor(Date.now() / 1000);
    const requestData = {
      payload,
      timestamp,
      serviceId
    };

    // Create signature of the entire request data
    const signature = createHmac('sha256', secretKey)
      .update(JSON.stringify(requestData))
      .digest('hex');

    return {
      payload,
      signature,
      timestamp,
      serviceId
    };
  }

  /**
   * Verify a signed request from another service
   */
  static verifyRequest(
    signedRequest: SignedRequest,
    expectedServiceId: string,
    secretKey: string
  ): { valid: boolean; reason?: string } {
    const { payload, signature, timestamp, serviceId } = signedRequest;

    // Check service ID
    if (serviceId !== expectedServiceId) {
      return { valid: false, reason: 'invalid_service_id' };
    }

    // Check timestamp (prevent replay attacks)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > this.REQUEST_TTL) {
      return { valid: false, reason: 'request_expired' };
    }

    // Verify signature
    const requestData = { payload, timestamp, serviceId };
    const expectedSignature = createHmac('sha256', secretKey)
      .update(JSON.stringify(requestData))
      .digest('hex');

    if (signature !== expectedSignature) {
      return { valid: false, reason: 'invalid_signature' };
    }

    return { valid: true };
  }

  /**
   * Create a service-specific secret key from master secret
   */
  static deriveServiceSecret(masterSecret: string, serviceId: string): string {
    return createHmac('sha256', masterSecret)
      .update(`service:${serviceId}`)
      .digest('hex');
  }
}