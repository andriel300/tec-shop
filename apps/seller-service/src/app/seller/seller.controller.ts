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
}