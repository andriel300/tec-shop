import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import type {
  ListUsersDto,
  BanUserDto,
  CreateAdminDto,
  ListSellersDto,
  UpdateSellerVerificationDto,
  ListOrdersDto,
  UpdateLayoutDto,
  CreateHeroSlideDto,
  UpdateHeroSlideDto,
  ReorderHeroSlidesDto,
} from '@tec-shop/dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    @Inject('ADMIN_SERVICE') private readonly adminService: ClientProxy
  ) {}

  // ============ User Management Endpoints ============

  @Get('users')
  @ApiOperation({ summary: 'List all users with pagination and filters (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'userType', required: false, enum: ['CUSTOMER', 'SELLER', 'ADMIN'] })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'BANNED'] })
  async listUsers(@Query() query: ListUsersDto) {
    this.logger.log(`Listing users with filters: ${JSON.stringify(query)}`);
    return await firstValueFrom(
      this.adminService.send('admin.listUsers', query)
    );
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get detailed user information (Admin only)' })
  @ApiResponse({ status: 200, description: 'User details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetails(@Param('id') userId: string) {
    this.logger.log(`Getting user details: ${userId}`);
    return await firstValueFrom(
      this.adminService.send('admin.getUserDetails', userId)
    );
  }

  @Post('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Cannot ban admin users or already banned' })
  async banUser(
    @Param('id') userId: string,
    @Body() dto: BanUserDto
  ) {
    this.logger.log(`Banning user: ${userId}`);
    return await firstValueFrom(
      this.adminService.send('admin.banUser', { userId, dto })
    );
  }

  @Post('users/:id/unban')
  @ApiOperation({ summary: 'Unban a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User unbanned successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'User is not banned' })
  async unbanUser(@Param('id') userId: string) {
    this.logger.log(`Unbanning user: ${userId}`);
    return await firstValueFrom(
      this.adminService.send('admin.unbanUser', userId)
    );
  }

  // ============ Admin Team Management Endpoints ============

  @Get('admins')
  @ApiOperation({ summary: 'List all admin users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Admins retrieved successfully' })
  async listAdmins() {
    this.logger.log('Listing all admin users');
    return await firstValueFrom(
      this.adminService.send('admin.listAdmins', {})
    );
  }

  @Post('admins')
  @ApiOperation({ summary: 'Create a new admin user (Admin only)' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async createAdmin(@Body() dto: CreateAdminDto) {
    this.logger.log(`Creating new admin: ${dto.email}`);
    return await firstValueFrom(
      this.adminService.send('admin.createAdmin', dto)
    );
  }

  @Delete('admins/:id')
  @ApiOperation({ summary: 'Delete an admin user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin deleted successfully' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete last admin or non-admin user' })
  async deleteAdmin(@Param('id') adminId: string) {
    this.logger.log(`Deleting admin: ${adminId}`);
    return await firstValueFrom(
      this.adminService.send('admin.deleteAdmin', adminId)
    );
  }

  // ============ Seller Management Endpoints ============

  @Get('sellers')
  @ApiOperation({ summary: 'List all sellers with pagination and filters (Admin only)' })
  @ApiResponse({ status: 200, description: 'Sellers retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
  async listSellers(@Query() query: ListSellersDto) {
    this.logger.log(`Listing sellers with filters: ${JSON.stringify(query)}`);
    return await firstValueFrom(
      this.adminService.send('admin.listSellers', query)
    );
  }

  @Put('sellers/:id/verification')
  @ApiOperation({ summary: 'Update seller verification status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Seller verification updated successfully' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async updateSellerVerification(
    @Param('id') sellerId: string,
    @Body() dto: UpdateSellerVerificationDto
  ) {
    this.logger.log(`Updating seller verification: ${sellerId}`);
    return await firstValueFrom(
      this.adminService.send('admin.updateSellerVerification', { sellerId, dto })
    );
  }

  // ============ Order Management Endpoints ============

  @Get('orders')
  @ApiOperation({ summary: 'List all platform orders with filters (Admin only)' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async listAllOrders(@Query() query: ListOrdersDto) {
    this.logger.log(`Listing all orders with filters: ${JSON.stringify(query)}`);
    return await firstValueFrom(
      this.adminService.send('admin.listAllOrders', query)
    );
  }

  // ============ Statistics Endpoints ============

  @Get('statistics')
  @ApiOperation({ summary: 'Get platform-wide statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics() {
    this.logger.log('Fetching platform statistics');
    return await firstValueFrom(
      this.adminService.send('admin.getStatistics', {})
    );
  }

  // ============ Site Layout Endpoints ============

  @Get('layout')
  @ApiOperation({ summary: 'Get site layout configuration (Admin only)' })
  @ApiResponse({ status: 200, description: 'Layout retrieved successfully' })
  async getLayout() {
    this.logger.log('Fetching site layout');
    return await firstValueFrom(
      this.adminService.send('admin.getLayout', {})
    );
  }

  @Put('layout')
  @ApiOperation({ summary: 'Update site layout configuration (Admin only)' })
  @ApiResponse({ status: 200, description: 'Layout updated successfully' })
  async updateLayout(@Body() dto: UpdateLayoutDto) {
    this.logger.log('Updating site layout');
    return await firstValueFrom(
      this.adminService.send('admin.updateLayout', dto)
    );
  }

  // ============ Hero Slide Endpoints ============

  @Put('layout/hero-slides/reorder')
  @ApiOperation({ summary: 'Reorder hero slides (Admin only)' })
  @ApiResponse({ status: 200, description: 'Hero slides reordered successfully' })
  async reorderHeroSlides(@Body() dto: ReorderHeroSlidesDto) {
    this.logger.log('Reordering hero slides');
    return await firstValueFrom(
      this.adminService.send('admin.reorderHeroSlides', dto)
    );
  }

  @Post('layout/hero-slides')
  @ApiOperation({ summary: 'Create a new hero slide (Admin only)' })
  @ApiResponse({ status: 201, description: 'Hero slide created successfully' })
  async createHeroSlide(@Body() dto: CreateHeroSlideDto) {
    this.logger.log(`Creating hero slide: ${dto.title}`);
    return await firstValueFrom(
      this.adminService.send('admin.createHeroSlide', dto)
    );
  }

  @Put('layout/hero-slides/:id')
  @ApiOperation({ summary: 'Update a hero slide (Admin only)' })
  @ApiResponse({ status: 200, description: 'Hero slide updated successfully' })
  @ApiResponse({ status: 404, description: 'Hero slide not found' })
  async updateHeroSlide(
    @Param('id') slideId: string,
    @Body() dto: UpdateHeroSlideDto
  ) {
    this.logger.log(`Updating hero slide: ${slideId}`);
    return await firstValueFrom(
      this.adminService.send('admin.updateHeroSlide', { slideId, dto })
    );
  }

  @Delete('layout/hero-slides/:id')
  @ApiOperation({ summary: 'Delete a hero slide (Admin only)' })
  @ApiResponse({ status: 200, description: 'Hero slide deleted successfully' })
  @ApiResponse({ status: 404, description: 'Hero slide not found' })
  async deleteHeroSlide(@Param('id') slideId: string) {
    this.logger.log(`Deleting hero slide: ${slideId}`);
    return await firstValueFrom(
      this.adminService.send('admin.deleteHeroSlide', slideId)
    );
  }
}
