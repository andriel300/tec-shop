import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Inject,
  Req,
  UseGuards,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import type { CreateCheckoutSessionDto } from '@tec-shop/dto';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(
    @Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy
  ) {}

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
    const session$ = this.orderClient.send('create-checkout-session', payload);
    return firstValueFrom(session$);
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
    const orders$ = this.orderClient.send('get-user-orders', req.user.userId);
    return firstValueFrom(orders$);
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
    const order$ = this.orderClient.send('get-order-by-id', payload);
    return firstValueFrom(order$);
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
    const order$ = this.orderClient.send('get-order-by-number', payload);
    return firstValueFrom(order$);
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
    const order$ = this.orderClient.send(
      'handle-successful-payment',
      sessionId
    );
    return firstValueFrom(order$);
  }
}
