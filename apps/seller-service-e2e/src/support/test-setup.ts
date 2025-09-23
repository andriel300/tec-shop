/* eslint-disable */
import axios from 'axios';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables for E2E testing
config({ path: join(__dirname, '../../../.env.e2e') });

module.exports = async function () {
  // Configure axios for API Gateway E2E tests
  const apiGatewayHost = process.env.API_GATEWAY_HOST ?? 'localhost';
  const apiGatewayPort = process.env.API_GATEWAY_PORT ?? '8080';

  axios.defaults.baseURL = `http://${apiGatewayHost}:${apiGatewayPort}`;
  axios.defaults.timeout = 30000; // 30 second timeout
  axios.defaults.validateStatus = (status) => status < 500; // Don't throw on 4xx responses

  console.log(`🔧 E2E Tests configured for API Gateway: ${axios.defaults.baseURL}`);

  // Wait for services to be ready (basic health check)
  try {
    await axios.get('/health', { timeout: 5000 });
    console.log('✅ API Gateway is ready for E2E tests');
  } catch (error) {
    console.warn('⚠️  API Gateway health check failed, tests may fail');
  }
};
