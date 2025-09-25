# Seller Service Testing Guide

This document provides comprehensive guidance for testing the seller-service microservice.

## 🧪 Testing Architecture

### Testing Pyramid

Our testing strategy follows the testing pyramid principle:

```
     🔺 E2E Tests (Few)
   🔺🔺 Integration Tests (Some)
🔺🔺🔺 Unit Tests (Many)
```

### Test Types

1. **Unit Tests** (`*.spec.ts`)
   - Test individual functions and methods in isolation
   - Mock all external dependencies
   - Fast execution (< 100ms per test)
   - High coverage target (80%+)

2. **Integration Tests** (`*.integration-spec.ts`)
   - Test component interactions within the service
   - Test controller-service communication
   - Test message pattern handling
   - Mock external services only

3. **Security Tests** (`*.security-spec.ts`)
   - Test authentication and authorization
   - Test input validation and sanitization
   - Test HMAC signature verification
   - Test security edge cases

4. **E2E Tests** (`*.e2e-spec.ts`)
   - Test complete workflows end-to-end
   - Use real database connections
   - Test microservice communication
   - Performance and load testing

## 📁 Test Structure

```
src/test/
├── README.md                 # This file
├── setup.ts                  # Global test setup
├── test-utils.ts            # Test utilities and helpers
├── factories.ts             # Test data factories
└── e2e/
    ├── jest-e2e.json        # E2E Jest configuration
    ├── setup.ts             # E2E test setup
    └── seller.e2e-spec.ts   # E2E test suite
```

## 🚀 Running Tests

### Quick Commands

```bash
# Run all tests
npx nx test seller-service

# Run unit tests only
npx nx test seller-service --testPathIgnorePatterns=".*\\.e2e-spec\\.ts$"

# Run E2E tests only
npx nx test seller-service --config=src/test/e2e/jest-e2e.json

# Run tests with coverage
npx nx test seller-service --coverage

# Run tests in watch mode
npx nx test seller-service --watch

# Run specific test file
npx nx test seller-service --testNamePattern="SellerService"
```

### Detailed Commands

```bash
# Unit tests with coverage threshold
npx nx test seller-service --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'

# Security tests only
npx nx test seller-service --testPathPattern=".*\\.security-spec\\.ts$"

# Performance tests
npx nx test seller-service --testPathPattern=".*\\.perf-spec\\.ts$" --runInBand

# Debug tests
npx nx test seller-service --debug --runInBand --no-cache
```

## 🛠️ Test Utilities

### TestUtils Class

```typescript
import { TestUtils } from './test-utils';

// Create testing module
const module = await TestUtils.createTestingModule([MyModule], [MyService]);

// Generate test data
const email = TestUtils.generateRandomEmail();
const objectId = TestUtils.generateRandomObjectId();

// Reset mocks
TestUtils.resetAllMocks(mockObjects);
```

### Test Data Factories

```typescript
import { TestDataFactory } from './factories';

// Create seller profile DTO
const sellerDto = TestDataFactory.createSellerProfileDto();

// Create shop DTO
const shopDto = TestDataFactory.createShopDto();

// Create seller entity with shop
const sellerWithShop = TestDataFactory.createSellerWithShop();

// Create signed request for security testing
const signedRequest = TestDataFactory.createSignedRequest(payload);
```

### Custom Jest Matchers

```typescript
// ObjectId validation
expect(sellerId).toBeValidObjectId();

// Schema validation
expect(seller).toMatchSellerSchema();
expect(shop).toMatchShopSchema();
```

## 🔒 Security Testing

### HMAC Signature Testing

```typescript
describe('Service Authentication', () => {
  it('should verify valid signed requests', () => {
    const payload = TestDataFactory.createSellerProfileDto();
    const signedRequest = ServiceAuthUtil.signRequest(payload, 'auth-service', 'secret');

    const result = ServiceAuthUtil.verifyRequest(signedRequest, 'auth-service', 'secret');

    expect(result).toEqual({ valid: true });
  });
});
```

### Input Validation Testing

```typescript
describe('Input Validation', () => {
  it('should reject malformed data', async () => {
    const invalidDto = { authId: 'invalid-id' };

    await expect(service.createProfile(invalidDto)).rejects.toThrow();
  });
});
```

## 📊 Performance Testing

### Load Testing

```typescript
describe('Performance', () => {
  it('should handle concurrent operations', async () => {
    const operations = Array.from({ length: 100 }, () =>
      service.createProfile(TestDataFactory.createSellerProfileDto())
    );

    const startTime = Date.now();
    await Promise.all(operations);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000); // 5 seconds
  });
});
```

## 🗄️ Database Testing

### Test Database Setup

```typescript
import { TestDatabase } from './test-utils';

beforeEach(async () => {
  await TestDatabase.cleanDatabase(prisma);
});

// Create test data
const seller = await TestDatabase.createTestSeller(prisma);
const shop = await TestDatabase.createTestShop(prisma, seller.id);
```

## 🔧 Mock Configuration

### Prisma Mocking

```typescript
import { createMockPrismaService, mockPrismaProvider } from './test-utils';

const mockPrisma = createMockPrismaService();

beforeEach(() => {
  mockPrisma.seller.findUnique.mockResolvedValue(mockSeller);
  mockPrisma.seller.create.mockResolvedValue(createdSeller);
});
```

### Service Mocking

```typescript
const mockSellerService = {
  createProfile: jest.fn(),
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});
```

## 📈 Coverage Requirements

### Coverage Thresholds

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Coverage Reports

```bash
# Generate coverage report
npx nx test seller-service --coverage

# View HTML coverage report
open test-output/jest/coverage/lcov-report/index.html
```

## 🚨 Error Testing

### Error Scenarios

```typescript
describe('Error Handling', () => {
  it('should handle database errors', async () => {
    mockPrisma.seller.findUnique.mockRejectedValue(new Error('DB Error'));

    await expect(service.getProfile('test-id')).rejects.toThrow('DB Error');
  });

  it('should handle not found errors', async () => {
    mockPrisma.seller.findUnique.mockResolvedValue(null);

    await expect(service.getProfile('test-id')).rejects.toThrow(NotFoundException);
  });
});
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: |
    npx nx test seller-service --coverage --ci
    npx nx test seller-service --config=src/test/e2e/jest-e2e.json
```

### Test Environment

```bash
# .env.test
NODE_ENV=test
DATABASE_URL=mongodb://localhost:27017/seller_service_test
SERVICE_MASTER_SECRET=test-secret
OTP_SALT=test-salt
```

## 📋 Best Practices

### 1. AAA Pattern

```typescript
it('should create seller profile', async () => {
  // Arrange
  const dto = TestDataFactory.createSellerProfileDto();
  mockPrisma.seller.create.mockResolvedValue(expectedResult);

  // Act
  const result = await service.createProfile(dto);

  // Assert
  expect(result).toEqual(expectedResult);
});
```

### 2. Test Isolation

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  TestUtils.resetAllMocks(allMocks);
});
```

### 3. Descriptive Test Names

```typescript
// Good
it('should throw NotFoundException when seller does not exist')

// Bad
it('should throw error')
```

### 4. Edge Case Testing

```typescript
describe('Edge Cases', () => {
  it('should handle concurrent updates gracefully');
  it('should handle malformed ObjectId gracefully');
  it('should handle large payloads gracefully');
});
```

## 🐛 Debugging Tests

### Debug Configuration

```bash
# Debug specific test
npx nx test seller-service --testNamePattern="createProfile" --debug

# Run with verbose output
TEST_VERBOSE=true npx nx test seller-service
```

### Common Issues

1. **Async/Await**: Always use `await` with async operations
2. **Mock Reset**: Clear mocks between tests
3. **Database Cleanup**: Clean test data between tests
4. **Environment Variables**: Use test-specific environment

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Happy Testing! 🧪**