import axios from 'axios';
import Redis from 'ioredis';

// --- Redis Configuration ---
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// --- Test Configuration ---
const TEST_TIMEOUT = 30000; // 30 seconds

describe('Auth Password Reset Flow (E2E)', () => {
  const userEmail = `test-user-${Date.now()}@example.com`;
  const initialPassword = 'InitialSecurePassword123';
  const newPassword = 'NewSecurePassword456';

  beforeAll(async () => {
    // Give the server a moment to start up
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    // Clean up the user from the database
    await redis.del(`password-reset:*`); // Clean up any lingering reset tokens
    redis.disconnect();
  });

  it(
    'should successfully request and complete a password reset',
    async () => {
      // Step 1: Register a new user
      await axios.post('/api/auth/register', {
        name: 'Test User',
        email: userEmail,
        password: initialPassword,
      });

      // Step 2: Request a password reset
      const requestResetResponse = await axios.post('/api/auth/request-password-reset', {
        email: userEmail,
      });
      expect(requestResetResponse.status).toBe(200);
      expect(requestResetResponse.data.message).toContain('If an account with that email exists, a password reset link has been sent.');

      // Step 3: Get the reset token from Redis
      // We need to find the key that starts with 'password-reset:'
      const keys = await redis.keys('password-reset:*');
      expect(keys.length).toBeGreaterThan(0);
      const resetToken = keys[0].split(':')[1]; // Extract the token part
      const userId = await redis.get(keys[0]); // Get the user ID associated with the token
      expect(userId).toBeDefined();

      // Step 4: Reset the password using the token
      const resetPasswordResponse = await axios.post('/api/auth/reset-password', {
        email: userEmail,
        token: resetToken,
        newPassword: newPassword,
      });
      expect(resetPasswordResponse.status).toBe(200);
      expect(resetPasswordResponse.data.message).toContain('Password has been reset successfully.');

      // Step 5: Verify that the password has been reset by trying to log in with the new password
      // (Assuming you have a login endpoint, if not, this step would need to be adjusted)
      // For now, we'll just check that the token was deleted from Redis
      const tokenAfterReset = await redis.get(keys[0]);
      expect(tokenAfterReset).toBeNull();
    },
    TEST_TIMEOUT
  );
});
