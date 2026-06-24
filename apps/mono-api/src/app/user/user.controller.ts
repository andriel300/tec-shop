import {
  Controller, Get, Put, Post, Delete, Body, Param, Req, UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MonoPrismaService } from '../prisma/prisma.service';

@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {

  constructor(private readonly prisma: MonoPrismaService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  async getProfile(@Req() req: any) {
    const userId = req.user.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, userType: true, isEmailVerified: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    return { ...user, profile };
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @Req() req: any,
    @Body() body: { name?: string; bio?: string; picture?: string },
  ) {
    const userId = req.user.userId;
    return this.prisma.userProfile.update({
      where: { userId },
      data: body,
    });
  }

  @Get('shipping-addresses')
  @ApiOperation({ summary: 'List shipping addresses' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved' })
  async getAddresses(@Req() req: any) {
    const userId = req.user.userId;
    return this.prisma.shippingAddress.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  @Post('shipping-addresses')
  @ApiOperation({ summary: 'Create shipping address' })
  @ApiResponse({ status: 201, description: 'Address created' })
  async createAddress(
    @Req() req: any,
    @Body() body: {
      label: string; name: string; street: string; city: string;
      state?: string; zipCode: string; country: string;
      phoneNumber?: string; isDefault?: boolean;
    },
  ) {
    const userId = req.user.userId;

    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('User profile not found');

    if (body.isDefault) {
      await this.prisma.shippingAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.shippingAddress.create({
      data: {
        userId,
        userProfileId: profile.id,
        label: body.label,
        name: body.name,
        street: body.street,
        city: body.city,
        state: body.state ?? null,
        zipCode: body.zipCode,
        country: body.country,
        phoneNumber: body.phoneNumber ?? null,
        isDefault: body.isDefault ?? false,
      },
    });
  }

  @Delete('shipping-addresses/:id')
  @ApiOperation({ summary: 'Delete shipping address' })
  @ApiResponse({ status: 200, description: 'Address deleted' })
  async deleteAddress(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    const address = await this.prisma.shippingAddress.findUnique({ where: { id } });
    if (!address || address.userId !== userId) {
      throw new NotFoundException('Address not found');
    }
    await this.prisma.shippingAddress.delete({ where: { id } });
    return { message: 'Address deleted' };
  }
}
