import {
  Controller, Get, Put, Post, Delete, Body, Param, Query, Req, UseGuards,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MonoPrismaService } from '../prisma/prisma.service';

@ApiTags('Seller')
@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
@ApiBearerAuth()
export class SellerController {

  constructor(private readonly prisma: MonoPrismaService) {}

  @Get('shop')
  @ApiOperation({ summary: 'Get seller shop' })
  @ApiResponse({ status: 200, description: 'Shop retrieved' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async getShop(@Req() req: any) {
    const authId = req.user.userId;
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: { shop: true },
    });
    if (!seller) throw new NotFoundException('Seller not found');
    return { seller, shop: seller.shop };
  }

  @Put('shop')
  @ApiOperation({ summary: 'Update seller shop' })
  @ApiResponse({ status: 200, description: 'Shop updated' })
  async updateShop(@Req() req: any, @Body() body: any) {
    const authId = req.user.userId;
    const seller = await this.prisma.seller.findUnique({ where: { authId } });
    if (!seller) throw new NotFoundException('Seller not found');

    return this.prisma.shop.update({
      where: { sellerId: seller.id },
      data: body,
    });
  }

  @Get('products')
  @ApiOperation({ summary: 'List seller products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Products retrieved' })
  async getProducts(
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const authId = req.user.userId;
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: { shop: true },
    });
    if (!seller?.shop) throw new NotFoundException('Seller shop not found');

    const take = Math.min(Math.max(limit ?? 20, 1), 100);
    const skip = offset ?? 0;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { shopId: seller.shop.id, deletedAt: null },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.product.count({
        where: { shopId: seller.shop.id, deletedAt: null },
      }),
    ]);

    return { products, total, limit: take, offset: skip };
  }

  @Post('products')
  @ApiOperation({ summary: 'Create product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  async createProduct(@Req() req: any, @Body() body: any) {
    const authId = req.user.userId;
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: { shop: true },
    });
    if (!seller?.shop) throw new NotFoundException('Seller shop not found');
    if (!body.name || body.price === undefined) {
      throw new BadRequestException('Name and price are required');
    }

    return this.prisma.product.create({
      data: {
        shopId: seller.shop.id,
        name: body.name,
        description: body.description ?? '',
        price: body.price,
        categoryId: body.categoryId,
        brandId: body.brandId,
        stock: body.stock ?? 0,
        images: body.images ?? [],
        tags: body.tags ?? [],
        status: body.status ?? 'DRAFT',
        visibility: body.visibility ?? 'PUBLIC',
        isActive: body.isActive ?? true,
        slug: body.slug,
        productType: body.productType ?? 'SIMPLE',
        salePrice: body.salePrice,
        hasVariants: body.hasVariants ?? false,
      },
    });
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  async updateProduct(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const authId = req.user.userId;
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: { shop: true },
    });
    if (!seller?.shop) throw new NotFoundException('Seller shop not found');

    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.shopId !== seller.shop.id) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: body,
    });
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Soft delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  async deleteProduct(@Req() req: any, @Param('id') id: string) {
    const authId = req.user.userId;
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: { shop: true },
    });
    if (!seller?.shop) throw new NotFoundException('Seller shop not found');

    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.shopId !== seller.shop.id) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Product deleted' };
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get seller orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved' })
  async getOrders(@Req() req: any) {
    const authId = req.user.userId;
    const seller = await this.prisma.seller.findUnique({ where: { authId } });
    if (!seller) throw new NotFoundException('Seller not found');

    return this.prisma.orderItem.findMany({
      where: { sellerId: seller.id },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
