import axios from 'axios';
import Redis from 'ioredis';

// --- Redis Configuration ---
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// --- Test Configuration ---
const TEST_TIMEOUT = 30000; // 30 seconds

// --- Test Suite ---

describe('Auth OTP Flow (E2E) with Redis', () => {
  const recipientEmail = `test-user-${Date.now()}@tec-shop.com`;

  beforeAll(async () => {
    // Give the server a moment to start up
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    // Clean up the OTP from Redis
    await redis.del(`otp:${recipientEmail}`);
    redis.disconnect();
  });

  it(
    'should successfully generate, store, and verify an OTP',
    async () => {
      // Step 1: Generate OTP
      const generateResponse = await axios.post('/api/auth/generate-otp', {
        email: recipientEmail,
      });
      expect(generateResponse.status).toBe(200);
      expect(generateResponse.data.message).toContain('An OTP has been sent');

      // Step 2: Get OTP from Redis
      const otp = await redis.get(`otp:${recipientEmail}`);
      expect(otp).toBeDefined();
      expect(otp).toHaveLength(6);

      // Step 3: Verify OTP
      const verifyResponse = await axios.post('/api/auth/verify-otp', {
        email: recipientEmail,
        otp,
      });
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.data).toHaveProperty('accessToken');
    },
    TEST_TIMEOUT
  );
});
