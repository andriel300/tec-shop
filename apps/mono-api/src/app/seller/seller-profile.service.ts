import { Injectable, Logger } from '@nestjs/common';
import { MonoPrismaService } from '../prisma/prisma.service';

@Injectable()
export class SellerProfileService {
  private readonly logger = new Logger(SellerProfileService.name);

  constructor(private readonly prisma: MonoPrismaService) {}

  async createSellerProfile(data: {
    authId: string;
    name: string;
    email: string;
    phoneNumber: string;
    country: string;
  }) {
    const seller = await this.prisma.seller.create({
      data: {
        authId: data.authId,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        country: data.country,
      },
    });
    this.logger.log(`Seller profile created for authId: ${data.authId}`);
    return seller;
  }
}
