import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'STRIPE_SECRET_KEY') return 'sk_test_fake_key_for_testing';
      if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_test_fake';
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(PaymentService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('constructor', () => {
    it('should throw when STRIPE_SECRET_KEY is missing', async () => {
      await expect(
        Test.createTestingModule({
          providers: [
            PaymentService,
            {
              provide: ConfigService,
              useValue: { get: jest.fn().mockReturnValue(undefined) },
            },
          ],
        }).compile()
      ).rejects.toThrow('STRIPE_SECRET_KEY environment variable not set');
    });
  });

  describe('calculatePlatformFee', () => {
    it('should return exactly 10% of the amount', () => {
      expect(service.calculatePlatformFee(1000)).toBe(100);
    });

    it('should floor fractional cents', () => {
      // 10% of 1099 = 109.9 -> floors to 109
      expect(service.calculatePlatformFee(1099)).toBe(109);
      // 10% of 1001 = 100.1 -> floors to 100
      expect(service.calculatePlatformFee(1001)).toBe(100);
    });

    it('should return 0 for zero amount', () => {
      expect(service.calculatePlatformFee(0)).toBe(0);
    });

    it('should handle large amounts correctly', () => {
      // $1000.00 = 100000 cents, fee = 10000 cents ($100)
      expect(service.calculatePlatformFee(100000)).toBe(10000);
    });
  });

  describe('calculateSellerPayout', () => {
    it('should split subtotal into platformFee and sellerPayout', () => {
      const result = service.calculateSellerPayout(1000);

      expect(result.platformFee).toBe(100);
      expect(result.sellerPayout).toBe(900);
    });

    it('should ensure platformFee + sellerPayout always equals subtotal', () => {
      const subtotals = [1000, 1099, 2500, 9999, 150];

      for (const subtotal of subtotals) {
        const { platformFee, sellerPayout } = service.calculateSellerPayout(subtotal);
        expect(platformFee + sellerPayout).toBe(subtotal);
      }
    });

    it('should floor fractional fee so seller is never shorted', () => {
      // 10% of 1099 = 109.9 -> floored to 109, seller gets 990 (not 989)
      const result = service.calculateSellerPayout(1099);

      expect(result.platformFee).toBe(109);
      expect(result.sellerPayout).toBe(990);
    });

    it('should handle zero subtotal', () => {
      const result = service.calculateSellerPayout(0);

      expect(result.platformFee).toBe(0);
      expect(result.sellerPayout).toBe(0);
    });
  });
});
