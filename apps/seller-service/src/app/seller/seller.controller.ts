import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SellerService } from './seller.service';
import { ServiceAuthUtil, SignedRequest } from './service-auth.util';

interface CreateSellerProfileDto {
  authId: string;
  name: string;
  email: string;
  phoneNumber: string;
  country: string;
}

interface UpdateShopDto {
  businessName: string;
  description?: string;
  category: string;
  address: string;
  website?: string;
  socialLinks?: any[];
}

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
    return this.sellerService.createProfile(signedRequest.payload);
  }

  @MessagePattern('get-seller-profile')
  async getProfile(@Payload() authId: string) {
    return this.sellerService.getProfile(authId);
  }

  @MessagePattern('update-seller-profile')
  async updateProfile(@Payload() payload: { authId: string; updateData: Partial<CreateSellerProfileDto> }) {
    return this.sellerService.updateProfile(payload.authId, payload.updateData);
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