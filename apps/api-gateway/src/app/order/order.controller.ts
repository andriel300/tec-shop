import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Inject,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import type { CreateCheckoutSessionDto, GetSellerOrdersDto } from '@tec-shop/dto';
import { JwtAuthGuard } from '../../guards/auth';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { CircuitBreakerService } from '../../common/circuit-breaker.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(
    @Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
    @Inject('SELLER_SERVICE') private readonly sellerClient: ClientProxy,
    private readonly cb: CircuitBreakerService
  ) {}

  @Put('verify-coupon-code')
  @ApiOperation({ summary: 'Verify coupon/discount code for cart items' })
  @ApiResponse({
    status: 200,
    description: 'Coupon code verified. Returns discount details if valid.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired coupon code.',
  })
  async verifyCouponCode(
    @Body()
    body: {
      couponCode: string;
      cart: {
        id: string;
        sellerId: string;
        price: number;
        quantity: number;
      }[];
    }
  ) {
    // Transform cart items to the format expected by seller-service
    const cartItems = body.cart.map((item) => ({
      productId: item.id,
      sellerId: item.sellerId,
      subtotal: Math.round(item.price * item.quantity * 100), // Convert to cents
    }));

    const payload = {
      code: body.couponCode,
      cartItems,
    };

    return this.cb.fire('SELLER_SERVICE', () => firstValueFrom(this.sellerClient.send(
      'seller-verify-coupon-code',
      payload
    )));
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @ApiOperation({ summary: 'Create a Stripe checkout session for cart items' })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created successfully. Returns session URL.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or empty cart.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 404,
    description: 'Shipping address not found.',
  })
  async createCheckoutSession(
    @Req() req: { user: { userId: string } },
    @Body() body: CreateCheckoutSessionDto
  ) {
    const payload = {
      userId: req.user.userId,
      data: body,
    };
    return this.cb.fire('ORDER_SERVICE', () => firstValueFrom(this.orderClient.send('create-checkout-session', payload)));
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all orders for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of orders with items.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getUserOrders(@Req() req: { user: { userId: string } }) {
    return this.cb.fire('ORDER_SERVICE', () => firstValueFrom(this.orderClient.send('get-user-orders', req.user.userId)));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Get('get-sellers-orders')
  @ApiOperation({ summary: 'Get orders for the current seller' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] })
  @ApiQuery({ name: 'shopId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Seller orders retrieved successfully with pagination.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - User is not a seller.' })
  async getSellerOrders(
    @Req() req: { user: { userId: string } },
    @Query() query: GetSellerOrdersDto
  ) {
    const payload = {
      ...query,
      sellerId: req.user.userId,
    };
    return this.cb.fire('ORDER_SERVICE', () => firstValueFrom(this.orderClient.send('get-seller-orders', payload)));
  }

  @UseGuards(JwtAuthGuard)
  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get a specific order by order number' })
  @ApiResponse({
    status: 200,
    description: 'Order details with items.',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getOrderByNumber(
    @Req() req: { user: { userId: string } },
    @Param('orderNumber') orderNumber: string
  ) {
    const payload = {
      userId: req.user.userId,
      orderNumber,
    };
    return this.cb.fire('ORDER_SERVICE', () => firstValueFrom(this.orderClient.send('get-order-by-number', payload)));
  }

  @Get('success/:sessionId')
  @ApiOperation({
    summary: 'Handle successful payment callback from Stripe',
  })
  @ApiResponse({
    status: 200,
    description: 'Order created successfully from payment session.',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment session not found.',
  })
  @ApiResponse({
    status: 400,
    description: 'Payment not completed.',
  })
  async handleSuccessfulPayment(@Param('sessionId') sessionId: string) {
    return this.cb.fire('ORDER_SERVICE', () => firstValueFrom(this.orderClient.send(
      'handle-successful-payment',
      sessionId
    )));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Get('seller/:id')
  @ApiOperation({ summary: 'Get order details for seller' })
  @ApiResponse({
    status: 200,
    description: 'Order details with seller items and payouts.',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - User is not a seller.' })
  async getSellerOrderDetails(
    @Req() req: { user: { userId: string } },
    @Param('id') orderId: string
  ) {
    const payload = {
      sellerId: req.user.userId,
      orderId,
    };
    return this.cb.fire('ORDER_SERVICE', () => firstValueFrom(this.orderClient.send('get-seller-order-details', payload)));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Post('seller/:id/status')
  @ApiOperation({ summary: 'Update order delivery status' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - User is not a seller.' })
  async updateDeliveryStatus(
    @Req() req: { user: { userId: string } },
    @Param('id') orderId: string,
    @Body() body: { status: string; trackingNumber?: string }
  ) {
    const payload = {
      sellerId: req.user.userId,
      orderId,
      status: body.status,
      trackingNumber: body.trackingNumber,
    };
    return this.cb.fire('ORDER_SERVICE', () => firstValueFrom(this.orderClient.send('update-delivery-status', payload)));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order details with items and payouts.',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getOrderById(
    @Req() req: { user: { userId: string } },
    @Param('id') orderId: string
  ) {
    const payload = {
      userId: req.user.userId,
      orderId,
    };
    return this.cb.fire('ORDER_SERVICE', () => firstValueFrom(this.orderClient.send('get-order-by-id', payload)));
  }
}
