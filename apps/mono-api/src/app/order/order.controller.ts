import {
  Controller, Get, Param, Req, UseGuards, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MonoPrismaService } from '../prisma/prisma.service';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {

  constructor(private readonly prisma: MonoPrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved' })
  async getOrders(@Req() req: any) {
    const userId = req.user.userId;
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiResponse({ status: 200, description: 'Order retrieved' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderByNumber(@Req() req: any, @Param('orderNumber') orderNumber: string) {
    const userId = req.user.userId;
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
