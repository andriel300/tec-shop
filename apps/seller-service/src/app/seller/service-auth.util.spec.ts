import { ServiceAuthUtil } from './service-auth.util';
import { TestDataFactory } from '../../test/factories';

describe('ServiceAuthUtil', () => {
  const mockSecretKey = 'test-secret-key-for-testing';
  const mockServiceId = 'test-service';
  const mockMasterSecret = 'master-secret-for-testing';

  beforeEach(() => {
    // Mock Date.now for consistent timestamp testing
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01 00:00:00 UTC
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('signRequest', () => {
    it('should create a valid signed request', () => {
      // Arrange
      const payload = TestDataFactory.createSellerProfileDto();

      // Act
      const signedRequest = ServiceAuthUtil.signRequest(payload, mockServiceId, mockSecretKey);

      // Assert
      expect(signedRequest).toHaveProperty('payload', payload);
      expect(signedRequest).toHaveProperty('signature');
      expect(signedRequest).toHaveProperty('timestamp');
      expect(signedRequest).toHaveProperty('serviceId', mockServiceId);
      expect(signedRequest.signature).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex string
      expect(signedRequest.timestamp).toBe(1640995200); // Mocked timestamp
    });

    it('should create different signatures for different payloads', () => {
      // Arrange
      const payload1 = TestDataFactory.createSellerProfileDto();
      const payload2 = TestDataFactory.createSellerProfileDto({ name: 'Different Name' });

      // Act
      const signed1 = ServiceAuthUtil.signRequest(payload1, mockServiceId, mockSecretKey);
      const signed2 = ServiceAuthUtil.signRequest(payload2, mockServiceId, mockSecretKey);

      // Assert
      expect(signed1.signature).not.toBe(signed2.signature);
    });

    it('should create different signatures for different service IDs', () => {
      // Arrange
      const payload = TestDataFactory.createSellerProfileDto();

      // Act
      const signed1 = ServiceAuthUtil.signRequest(payload, 'service-1', mockSecretKey);
      const signed2 = ServiceAuthUtil.signRequest(payload, 'service-2', mockSecretKey);

      // Assert
      expect(signed1.signature).not.toBe(signed2.signature);
    });

    it('should create different signatures for different secret keys', () => {
      // Arrange
      const payload = TestDataFactory.createSellerProfileDto();

      // Act
      const signed1 = ServiceAuthUtil.signRequest(payload, mockServiceId, 'secret-1');
      const signed2 = ServiceAuthUtil.signRequest(payload, mockServiceId, 'secret-2');

      // Assert
      expect(signed1.signature).not.toBe(signed2.signature);
    });

    it('should handle complex nested payloads', () => {
      // Arrange
      const complexPayload = {
        user: TestDataFactory.createSellerProfileDto(),
        shop: TestDataFactory.createShopDto(),
        metadata: {
          version: '1.0',
          features: ['feature1', 'feature2'],
          config: { enabled: true, maxRetries: 3 }
        }
      };

      // Act
      const signedRequest = ServiceAuthUtil.signRequest(complexPayload, mockServiceId, mockSecretKey);

      // Assert
      expect(signedRequest.payload).toEqual(complexPayload);
      expect(signedRequest.signature).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('verifyRequest', () => {
    it('should verify a valid signed request', () => {
      // Arrange
      const payload = TestDataFactory.createSellerProfileDto();
      const signedRequest = ServiceAuthUtil.signRequest(payload, mockServiceId, mockSecretKey);

      // Act
      const result = ServiceAuthUtil.verifyRequest(signedRequest, mockServiceId, mockSecretKey);

      // Assert
      expect(result).toEqual({ valid: true });
    });

    it('should reject request with invalid signature', () => {
      // Arrange
      const payload = TestDataFactory.createSellerProfileDto();
      const signedRequest = ServiceAuthUtil.signRequest(payload, mockServiceId, mockSecretKey);
      signedRequest.signature = 'invalid-signature';

      // Act
      const result = ServiceAuthUtil.verifyRequest(signedRequest, mockServiceId, mockSecretKey);

      // Assert
      expect(result).toEqual({ valid: false, reason: 'invalid_signature' });
    });

    it('should reject request with wrong service ID', () => {
      // Arrange
      const payload = TestDataFactory.createSellerProfileDto();
      const signedRequest = ServiceAuthUtil.signRequest(payload, 'wrong-service', mockSecretKey);

      // Act
      const result = ServiceAuthUtil.verifyRequest(signedRequest, mockServiceId, mockSecretKey);

      // Assert
      expect(result).toEqual({ valid: false, reason: 'invalid_service_id' });
    });

    it('should reject expired request', () => {
      // Arrange
      const payload = TestDataFactory.createSellerProfileDto();

      // Mock old timestamp (more than 5 minutes ago)
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000 - 400 * 1000); // 400 seconds ago
      const signedRequest = ServiceAuthUtil.signRequest(payload, mockServiceId, mockSecretKey);

      // Restore current time
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000);

      // Act
      const result = ServiceAuthUtil.verifyRequest(signedRequest, mockServiceId, mockSecretKey);

      // Assert
      expect(result).toEqual({ valid: false, reason: 'request_expired' });
    });

    it('should accept request within TTL window', () => {
      // Arrange
      const payload = TestDataFactory.createSellerProfileDto();

      // Mock timestamp 4 minutes ago (within 5-minute TTL)
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000 - 240 * 1000);
      const signedRequest = ServiceAuthUtil.signRequest(payload, mockServiceId, mockSecretKey);

      // Restore current time
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000);

      // Act
      const result = ServiceAuthUtil.verifyRequest(signedRequest, mockServiceId, mockSecretKey);

      // Assert
      expect(result).toEqual({ valid: true });
    });

    it('should reject request with tampered payload', () => {
      // Arrange
      const originalPayload = TestDataFactory.createSellerProfileDto();
      const signedRequest = ServiceAuthUtil.signRequest(originalPayload, mockServiceId, mockSecretKey);

      // Tamper with payload after signing
      signedRequest.payload.name = 'Tampered Name';

      // Act
      const result = ServiceAuthUtil.verifyRequest(signedRequest, mockServiceId, mockSecretKey);

      // Assert
      expect(result).toEqual({ valid: false, reason: 'invalid_signature' });
    });

    it('should reject request with tampered timestamp', () => {
      // Arrange
      const payload = TestDataFactory.createSellerProfileDto();
      const signedRequest = ServiceAuthUtil.signRequest(payload, mockServiceId, mockSecretKey);

      // Tamper with timestamp after signing
      signedRequest.timestamp = signedRequest.timestamp + 100;

      // Act
      const result = ServiceAuthUtil.verifyRequest(signedRequest, mockServiceId, mockSecretKey);

      // Assert
      expect(result).toEqual({ valid: false, reason: 'invalid_signature' });
    });
  });

  describe('deriveServiceSecret', () => {
    it('should generate consistent service secrets', () => {
      // Act
      const secret1 = ServiceAuthUtil.deriveServiceSecret(mockMasterSecret, 'service-1');
      const secret2 = ServiceAuthUtil.deriveServiceSecret(mockMasterSecret, 'service-1');

      // Assert
      expect(secret1).toBe(secret2);
      expect(secret1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex string
    });

    it('should generate different secrets for different services', () => {
      // Act
      const secret1 = ServiceAuthUtil.deriveServiceSecret(mockMasterSecret, 'service-1');
      const secret2 = ServiceAuthUtil.deriveServiceSecret(mockMasterSecret, 'service-2');

      // Assert
      expect(secret1).not.toBe(secret2);
    });

    it('should generate different secrets for different master secrets', () => {
      // Act
      const secret1 = ServiceAuthUtil.deriveServiceSecret('master-1', 'service-1');
      const secret2 = ServiceAuthUtil.deriveServiceSecret('master-2', 'service-1');

      // Assert
      expect(secret1).not.toBe(secret2);
    });

    it('should handle empty service IDs', () => {
      // Act
      const secret1 = ServiceAuthUtil.deriveServiceSecret(mockMasterSecret, '');
      const secret2 = ServiceAuthUtil.deriveServiceSecret(mockMasterSecret, 'non-empty');

      // Assert
      expect(secret1).not.toBe(secret2);
      expect(secret1).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle injection attempts in service ID', () => {
      // Arrange
      const maliciousServiceId = 'service"; DROP TABLE users; --';
      const payload = TestDataFactory.createSellerProfileDto();

      // Act
      const signedRequest = ServiceAuthUtil.signRequest(payload, maliciousServiceId, mockSecretKey);
      const result = ServiceAuthUtil.verifyRequest(signedRequest, maliciousServiceId, mockSecretKey);

      // Assert
      expect(result).toEqual({ valid: true });
      expect(signedRequest.serviceId).toBe(maliciousServiceId);
    });

    it('should handle very large payloads', () => {
      // Arrange
      const largePayload = {
        data: 'x'.repeat(100000), // 100KB string
        ...TestDataFactory.createSellerProfileDto()
      };

      // Act
      const signedRequest = ServiceAuthUtil.signRequest(largePayload, mockServiceId, mockSecretKey);
      const result = ServiceAuthUtil.verifyRequest(signedRequest, mockServiceId, mockSecretKey);

      // Assert
      expect(result).toEqual({ valid: true });
    });

    it('should handle unicode characters in payload', () => {
      // Arrange
      const unicodePayload = {
        name: '测试用户 🚀 émoji',
        description: 'العربية русский 한국어',
        ...TestDataFactory.createSellerProfileDto()
      };

      // Act
      const signedRequest = ServiceAuthUtil.signRequest(unicodePayload, mockServiceId, mockSecretKey);
      const result = ServiceAuthUtil.verifyRequest(signedRequest, mockServiceId, mockSecretKey);

      // Assert
      expect(result).toEqual({ valid: true });
    });

    it('should handle special characters in secret key', () => {
      // Arrange
      const specialSecret = 'secret-with-$pecial-ch@rs!&*()+={}[]|\\:";\'<>?,./';
      const payload = TestDataFactory.createSellerProfileDto();

      // Act
      const signedRequest = ServiceAuthUtil.signRequest(payload, mockServiceId, specialSecret);
      const result = ServiceAuthUtil.verifyRequest(signedRequest, mockServiceId, specialSecret);

      // Assert
      expect(result).toEqual({ valid: true });
    });
  });

  describe('Replay Attack Prevention', () => {
    it('should reject requests with future timestamps', () => {
      // Arrange
      const payload = TestDataFactory.createSellerProfileDto();

      // Mock future timestamp (6 minutes in the future)
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000 + 360 * 1000);
      const signedRequest = ServiceAuthUtil.signRequest(payload, mockServiceId, mockSecretKey);

      // Restore current time
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000);

      // Act
      const result = ServiceAuthUtil.verifyRequest(signedRequest, mockServiceId, mockSecretKey);

      // Assert
      expect(result).toEqual({ valid: false, reason: 'request_expired' });
    });

    it('should accept requests with slightly future timestamps within tolerance', () => {
      // Arrange
      const payload = TestDataFactory.createSellerProfileDto();

      // Mock timestamp 1 minute in the future (within 5-minute tolerance)
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000 + 60 * 1000);
      const signedRequest = ServiceAuthUtil.signRequest(payload, mockServiceId, mockSecretKey);

      // Restore current time
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000);

      // Act
      const result = ServiceAuthUtil.verifyRequest(signedRequest, mockServiceId, mockSecretKey);

      // Assert
      expect(result).toEqual({ valid: true });
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid signing operations', () => {
      // Arrange
      const payloads = Array.from({ length: 1000 }, () => TestDataFactory.createSellerProfileDto());

      // Act
      const startTime = Date.now();
      const signedRequests = payloads.map(payload =>
        ServiceAuthUtil.signRequest(payload, mockServiceId, mockSecretKey)
      );
      const signingDuration = Date.now() - startTime;

      // Verify all requests
      const verifyStartTime = Date.now();
      const results = signedRequests.map(signed =>
        ServiceAuthUtil.verifyRequest(signed, mockServiceId, mockSecretKey)
      );
      const verifyDuration = Date.now() - verifyStartTime;

      // Assert
      expect(signedRequests).toHaveLength(1000);
      expect(results.every(r => r.valid)).toBe(true);
      expect(signingDuration).toBeLessThan(1000); // Should sign 1000 requests in under 1 second
      expect(verifyDuration).toBeLessThan(1000); // Should verify 1000 requests in under 1 second
    });
  });
});