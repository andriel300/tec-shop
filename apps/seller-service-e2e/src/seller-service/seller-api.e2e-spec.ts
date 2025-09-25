import axios from 'axios';

describe('Seller Service API E2E Tests', () => {
  const API_BASE_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';
  let _accessToken: string;
  let sellerData: Record<string, unknown>;

  beforeAll(async () => {
    // Setup test environment
    // Ensure API Gateway and all services are running
  });

  afterAll(async () => {
    // Cleanup test data
  });

  describe('Seller Authentication Flow', () => {
    it('should register new seller through API Gateway', async () => {
      // Arrange
      const sellerSignupData = {
        name: 'Test Seller E2E',
        email: `e2e-test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        phoneNumber: '+1234567890',
        country: 'US'
      };

      // Act
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/seller/signup`,
        sellerSignupData
      );

      // Assert
      expect(response.status).toBe(201);
      expect(response.data.message).toContain('Seller signup successful');

      sellerData = sellerSignupData;
    });

    it('should verify seller email through API Gateway', async () => {
      // This would require OTP from email in real E2E test
      // For demo purposes, using mock OTP
      const verifyData = {
        email: sellerData.email,
        otp: '123456' // In real test, get from test email service
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/seller/verify-email`,
        verifyData
      );

      expect(response.status).toBe(201);
      expect(response.data.message).toContain('verified successfully');
    });

    it('should login seller through API Gateway', async () => {
      const loginData = {
        email: sellerData.email,
        password: sellerData.password,
        rememberMe: false
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/seller/login`,
        loginData,
        { withCredentials: true } // To receive cookies
      );

      expect(response.status).toBe(201);
      expect(response.data.message).toBe('Seller login successful');

      // Extract access token from cookies for subsequent requests
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });
  });

  describe('Seller Profile Management through API', () => {
    it('should get seller profile through API Gateway', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/seller/profile`,
        { withCredentials: true }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('authId');
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('email', sellerData.email);
    });

    it('should update seller profile through API Gateway', async () => {
      const updateData = {
        name: 'Updated Seller Name E2E',
        phoneNumber: '+9876543210'
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/seller/profile`,
        updateData,
        { withCredentials: true }
      );

      expect(response.status).toBe(200);
      expect(response.data.name).toBe(updateData.name);
      expect(response.data.phoneNumber).toBe(updateData.phoneNumber);
    });
  });

  describe('Shop Management through API', () => {
    it('should create shop through API Gateway', async () => {
      const shopData = {
        businessName: 'E2E Test Shop',
        description: 'Test shop for E2E testing',
        category: 'Technology',
        address: '123 E2E Test Street, Test City, TC 12345',
        website: 'https://e2etest.example.com'
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/seller/shop`,
        shopData,
        { withCredentials: true }
      );

      expect(response.status).toBe(201);
      expect(response.data.businessName).toBe(shopData.businessName);
      expect(response.data.category).toBe(shopData.category);
    });

    it('should get shop through API Gateway', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/seller/shop`,
        { withCredentials: true }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('businessName');
      expect(response.data).toHaveProperty('category');
    });

    it('should get dashboard data through API Gateway', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/seller/dashboard`,
        { withCredentials: true }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('seller');
      expect(response.data).toHaveProperty('shop');
      expect(response.data.seller.email).toBe(sellerData.email);
    });
  });

  describe('Error Handling through API', () => {
    it('should return 401 for unauthorized requests', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/seller/profile`);
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should return 404 for non-existent endpoints', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/seller/non-existent`);
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should validate input data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123' // Too short
      };

      try {
        await axios.post(`${API_BASE_URL}/api/auth/seller/signup`, invalidData);
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        axios.get(
          `${API_BASE_URL}/api/seller/dashboard`,
          { withCredentials: true }
        )
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});