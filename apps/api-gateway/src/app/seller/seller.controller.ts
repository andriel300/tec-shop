import {
  Body,
  Controller,
  Inject,
  Get,
  Post,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import {
  CreateSellerProfileDto,
  CreateShopDto,
  UpdateShopDto,
} from '@tec-shop/dto';

@ApiTags('Seller')
@Controller('seller')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SellerController {
  constructor(
    @Inject('SELLER_SERVICE') private readonly sellerService: ClientProxy
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get seller profile' })
  @ApiResponse({
    status: 200,
    description: 'Seller profile retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Seller profile not found.' })
  async getProfile(@Req() request: { user: { userId: string } }) {
    return await firstValueFrom(
      this.sellerService.send('get-seller-profile', request.user.userId)
    );
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update seller profile' })
  @ApiResponse({
    status: 200,
    description: 'Seller profile updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Seller profile not found.' })
  async updateProfile(
    @Req() request: { user: { userId: string } },
    @Body() updateData: Partial<CreateSellerProfileDto>
  ) {
    return await firstValueFrom(
      this.sellerService.send('update-seller-profile', {
        authId: request.user.userId,
        updateData,
      })
    );
  }

  @Post('shop/create')
  @ApiOperation({ summary: 'Create a new seller shop' })
  @ApiResponse({
    status: 201,
    description: 'Shop created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Shop already exists or invalid data.',
  })
  @ApiResponse({ status: 404, description: 'Seller profile not found.' })
  async createShop(
    @Req() request: { user: { userId: string } },
    @Body() shopData: CreateShopDto
  ) {
    return await firstValueFrom(
      this.sellerService.send('create-shop', {
        authId: request.user.userId,
        shopData,
      })
    );
  }

  @Post('shop')
  @ApiOperation({ summary: 'Create or update seller shop' })
  @ApiResponse({
    status: 201,
    description: 'Shop created or updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Seller profile not found.' })
  async createOrUpdateShop(
    @Req() request: { user: { userId: string } },
    @Body() shopData: UpdateShopDto
  ) {
    return await firstValueFrom(
      this.sellerService.send('create-or-update-shop', {
        authId: request.user.userId,
        shopData,
      })
    );
  }

  @Get('shop')
  @ApiOperation({ summary: 'Get seller shop' })
  @ApiResponse({
    status: 200,
    description: 'Shop information retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Seller profile not found.' })
  async getShop(@Req() request: { user: { userId: string } }) {
    return await firstValueFrom(
      this.sellerService.send('get-seller-shop', request.user.userId)
    );
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get seller dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Seller profile not found.' })
  async getDashboardData(@Req() request: { user: { userId: string } }) {
    return await firstValueFrom(
      this.sellerService.send('get-seller-dashboard', request.user.userId)
    );
  }
}
