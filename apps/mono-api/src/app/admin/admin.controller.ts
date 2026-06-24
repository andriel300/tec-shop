import {
  Controller, Get, Post, Param, Query, UseGuards, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MonoPrismaService } from '../prisma/prisma.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {

  constructor(private readonly prisma: MonoPrismaService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Users retrieved' })
  async getUsers(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const take = Math.min(Math.max(limit ?? 20, 1), 100);
    const skip = offset ?? 0;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true, email: true, userType: true,
          isEmailVerified: true, isBanned: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.user.count(),
    ]);

    return { users, total, limit: take, offset: skip };
  }

  @Get('sellers')
  @ApiOperation({ summary: 'List all sellers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Sellers retrieved' })
  async getSellers(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const take = Math.min(Math.max(limit ?? 20, 1), 100);
    const skip = offset ?? 0;

    const [sellers, total] = await Promise.all([
      this.prisma.seller.findMany({
        include: { shop: true },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.seller.count(),
    ]);

    return { sellers, total, limit: take, offset: skip };
  }

  @Post('sellers/:id/verify')
  @ApiOperation({ summary: 'Toggle seller verification' })
  @ApiResponse({ status: 200, description: 'Verification toggled' })
  async verifySeller(@Param('id') id: string) {
    const seller = await this.prisma.seller.findUnique({ where: { id } });
    if (!seller) throw new NotFoundException('Seller not found');

    return this.prisma.seller.update({
      where: { id },
      data: { isVerified: !seller.isVerified },
    });
  }
}
