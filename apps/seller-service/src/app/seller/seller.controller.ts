import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SellerProfileService } from './seller-profile.service';
import { ShopService } from './shop.service';
import { ServiceAuthUtil } from '@tec-shop/service-auth';
import type { SignedRequest } from '@tec-shop/service-auth';
import type {
  CreateSellerProfileDto,
  CreateShopDto,
  UpdateShopDto,
} from '@tec-shop/dto';

@Controller()
export class SellerController {
  constructor(
    private readonly sellerProfile: SellerProfileService,
    private readonly shopService: ShopService
  ) {}

  @MessagePattern('create-seller-profile')
  async createProfile(@Payload() createProfileDto: CreateSellerProfileDto) {
    return this.sellerProfile.createProfile(createProfileDto);
  }

  @MessagePattern('create-seller-profile-signed')
  async createProfileSigned(@Payload() signedRequest: SignedRequest) {
    if (!process.env.SERVICE_MASTER_SECRET) {
      throw new Error(
        'SERVICE_MASTER_SECRET environment variable is not configured. This is required for secure service-to-service communication.'
      );
    }

    const authServiceSecret = ServiceAuthUtil.deriveServiceSecret(
      process.env.SERVICE_MASTER_SECRET,
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

    return this.sellerProfile.createProfile(
      signedRequest.payload as unknown as CreateSellerProfileDto
    );
  }

  @MessagePattern('get-seller-profile')
  async getProfile(@Payload() authId: string) {
    return this.sellerProfile.getProfile(authId);
  }

  @MessagePattern('update-seller-profile')
  async updateProfile(
    @Payload()
    payload: {
      authId: string;
      updateData: Partial<CreateSellerProfileDto>;
    }
  ) {
    return this.sellerProfile.updateProfile(payload.authId, payload.updateData);
  }

  @MessagePattern('get-seller-dashboard')
  async getDashboardData(@Payload() authId: string) {
    return this.sellerProfile.getDashboardData(authId);
  }

  @MessagePattern('update-seller-notification-preferences')
  async updateNotificationPreferences(
    @Payload() payload: { authId: string; preferences: Record<string, boolean> }
  ) {
    return this.sellerProfile.updateNotificationPreferences(
      payload.authId,
      payload.preferences
    );
  }

  @MessagePattern('get-seller-notification-preferences')
  async getNotificationPreferences(@Payload() authId: string) {
    return this.sellerProfile.getNotificationPreferences(authId);
  }

  @MessagePattern('create-shop')
  async createShop(
    @Payload() payload: { authId: string; shopData: CreateShopDto }
  ) {
    return this.shopService.createShop(payload.authId, payload.shopData);
  }

  @MessagePattern('create-or-update-shop')
  async createOrUpdateShop(
    @Payload() payload: { authId: string; shopData: UpdateShopDto }
  ) {
    return this.shopService.createOrUpdateShop(payload.authId, payload.shopData);
  }

  @MessagePattern('get-seller-shop')
  async getShop(@Payload() authId: string) {
    return this.shopService.getShop(authId);
  }

  @MessagePattern('seller-verify-shop')
  async verifyShop(@Payload() payload: { shopId: string }): Promise<boolean> {
    return this.shopService.verifyShopExists(payload.shopId);
  }

  @MessagePattern('seller-get-shop-by-id')
  async getShopById(@Payload() payload: { shopId: string }) {
    return this.shopService.getShopById(payload.shopId);
  }

  @MessagePattern('seller-get-filtered-shops')
  async getFilteredShops(
    @Payload()
    payload: {
      search?: string;
      category?: string;
      country?: string;
      minRating?: number;
      limit?: number;
      offset?: number;
    }
  ) {
    return this.shopService.getFilteredShops(payload);
  }

  @MessagePattern('seller-verify-shop-ownership')
  async verifyShopOwnership(
    @Payload() payload: { sellerId: string; shopId: string }
  ): Promise<boolean> {
    return this.shopService.verifyShopOwnership(payload.sellerId, payload.shopId);
  }

  @MessagePattern('seller-get-statistics')
  async getStatistics(@Payload() authId: string) {
    return this.shopService.getStatistics(authId);
  }

  @MessagePattern('get-seller-by-auth-id')
  async getSellerByAuthId(@Payload() authId: string) {
    return this.sellerProfile.getSellerByAuthId(authId);
  }
}
