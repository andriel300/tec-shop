import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SellerService } from './seller.service';
import { ServiceAuthUtil } from './service-auth.util';
import type { SignedRequest } from './service-auth.util';
import type { CreateSellerProfileDto, CreateShopDto, UpdateShopDto } from '@tec-shop/dto';

@Controller()
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @MessagePattern('create-seller-profile')
  async createProfile(@Payload() createProfileDto: CreateSellerProfileDto) {
    return this.sellerService.createProfile(createProfileDto);
  }

  @MessagePattern('create-seller-profile-signed')
  async createProfileSigned(@Payload() signedRequest: SignedRequest) {
    // Verify the signed request from auth-service (Security Hardened)
    const authServiceSecret = ServiceAuthUtil.deriveServiceSecret(
      process.env.SERVICE_MASTER_SECRET || 'default-secret',
      'auth-service'
    );

    const verification = ServiceAuthUtil.verifyRequest(
      signedRequest,
      'auth-service',
      authServiceSecret
    );

    if (!verification.valid) {
      throw new Error(`Invalid service request: ${verification.reason}`);
    }

    // Process the verified request
    return this.sellerService.createProfile(signedRequest.payload as unknown as CreateSellerProfileDto);
  }

  @MessagePattern('get-seller-profile')
  async getProfile(@Payload() authId: string) {
    return this.sellerService.getProfile(authId);
  }

  @MessagePattern('update-seller-profile')
  async updateProfile(@Payload() payload: { authId: string; updateData: Partial<CreateSellerProfileDto> }) {
    return this.sellerService.updateProfile(payload.authId, payload.updateData);
  }

  @MessagePattern('create-shop')
  async createShop(@Payload() payload: { authId: string; shopData: CreateShopDto }) {
    return this.sellerService.createShop(payload.authId, payload.shopData);
  }

  @MessagePattern('create-or-update-shop')
  async createOrUpdateShop(@Payload() payload: { authId: string; shopData: UpdateShopDto }) {
    return this.sellerService.createOrUpdateShop(payload.authId, payload.shopData);
  }

  @MessagePattern('get-seller-shop')
  async getShop(@Payload() authId: string) {
    return this.sellerService.getShop(authId);
  }

  @MessagePattern('get-seller-dashboard')
  async getDashboardData(@Payload() authId: string) {
    return this.sellerService.getDashboardData(authId);
  }

  // ============================================
  // Product Service Integration Endpoints
  // ============================================

  /**
   * Verify that a shop exists by its ID
   * Used by product-service to validate shopId references
   */
  @MessagePattern('seller-verify-shop')
  async verifyShop(@Payload() payload: { shopId: string }): Promise<boolean> {
    return this.sellerService.verifyShopExists(payload.shopId);
  }

  /**
   * Get shop details by shop ID
   * Used by product-service to fetch shop information
   */
  @MessagePattern('seller-get-shop-by-id')
  async getShopById(@Payload() payload: { shopId: string }) {
    return this.sellerService.getShopById(payload.shopId);
  }

  /**
   * Verify that a seller owns a specific shop
   * Used by product-service for authorization checks
   */
  @MessagePattern('seller-verify-shop-ownership')
  async verifyShopOwnership(@Payload() payload: { sellerId: string; shopId: string }): Promise<boolean> {
    return this.sellerService.verifyShopOwnership(payload.sellerId, payload.shopId);
  }
}