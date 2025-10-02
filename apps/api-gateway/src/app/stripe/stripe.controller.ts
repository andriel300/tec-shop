import { Controller, Post, Get, Inject, Req, Res, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth/jwt-auth.guard';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Stripe Connect')
@Controller('seller/stripe')
export class StripeController {
  constructor(
    @Inject('SELLER_SERVICE') private readonly sellerService: ClientProxy
  ) {}

  @Post('onboard')
  @UseGuards(JwtAuthGuard)
  @Throttle({ medium: { limit: 5, ttl: 300000 } }) // 5 requests per 5 minutes
  @ApiOperation({ summary: 'Start Stripe Connect onboarding for seller' })
  @ApiResponse({
    status: 201,
    description: 'Onboarding link created successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Stripe onboarding URL' },
        expires_at: { type: 'number', description: 'Link expiration timestamp' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid JWT token' })
  @ApiResponse({ status: 400, description: 'Bad request - seller setup issue' })
  async createOnboardingLink(@Req() request: Request & { user: { userId: string; userType: string } }) {
    // Verify user is a seller
    if (request.user.userType !== 'SELLER') {
      throw new BadRequestException('Only sellers can access Stripe onboarding');
    }

    const authId = request.user.userId;

    return await firstValueFrom(
      this.sellerService.send('stripe-create-connect-account', authId)
    );
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Get Stripe Connect account status' })
  @ApiResponse({
    status: 200,
    description: 'Account status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['NOT_STARTED', 'PENDING', 'INCOMPLETE', 'COMPLETE', 'RESTRICTED', 'REJECTED'] },
        canAcceptPayments: { type: 'boolean' },
        requiresAction: { type: 'boolean' },
        requirements: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  async getAccountStatus(@Req() request: Request & { user: { userId: string; userType: string } }) {
    // Verify user is a seller
    if (request.user.userType !== 'SELLER') {
      throw new BadRequestException('Only sellers can check Stripe status');
    }

    const authId = request.user.userId;

    return await firstValueFrom(
      this.sellerService.send('stripe-get-account-status', authId)
    );
  }

  @Get('return')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute per IP
  @ApiOperation({ summary: 'Handle successful Stripe onboarding return' })
  @ApiResponse({ status: 200, description: 'Onboarding completed successfully' })
  async handleOnboardingReturn(
    @Query('authId') authId: string,
    @Query('state') state: string,
    @Res() response: Response
  ) {
    if (!authId || !state) {
      throw new BadRequestException('authId and state query parameters are required');
    }

    try {
      // Verify state parameter to prevent CSRF and session fixation attacks
      const result = await firstValueFrom(
        this.sellerService.send('stripe-handle-connect-return', { authId, state })
      );

      // Only redirect on successful validation
      if (result.success) {
        const redirectUrl = `${this.getFrontendUrl()}/signup?step=3&stripe=success`;
        response.redirect(redirectUrl);
      } else {
        throw new Error('State validation failed');
      }
    } catch (error) {
      // Log error without exposing sensitive parameters
      console.error('Stripe return handling failed:', { error: error instanceof Error ? error.message : 'Unknown error' });
      // Redirect to error page
      const errorUrl = `${this.getFrontendUrl()}/signup?step=3&stripe=error`;
      response.redirect(errorUrl);
    }
  }

  @Get('refresh')
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 requests per 5 minutes per IP
  @ApiOperation({ summary: 'Handle Stripe onboarding refresh (restart)' })
  @ApiResponse({ status: 302, description: 'Redirect to new onboarding link' })
  async handleOnboardingRefresh(
    @Query('authId') authId: string,
    @Query('state') state: string,
    @Res() response: Response
  ) {
    if (!authId || !state) {
      throw new BadRequestException('authId and state query parameters are required');
    }

    try {
      // Verify state parameter before processing refresh
      const result = await firstValueFrom(
        this.sellerService.send('stripe-handle-connect-refresh', { authId, state })
      );

      // Only redirect on successful validation
      if (result.success && result.url) {
        response.redirect(result.url);
      } else {
        throw new Error('State validation failed or no URL returned');
      }
    } catch (error) {
      // Log error without exposing sensitive parameters
      console.error('Stripe refresh handling failed:', { error: error instanceof Error ? error.message : 'Unknown error' });
      // Redirect to error page
      const errorUrl = `${this.getFrontendUrl()}/signup?step=3&stripe=error`;
      response.redirect(errorUrl);
    }
  }

  /**
   * Get frontend URL for redirects
   */
  private getFrontendUrl(): string {
    return process.env.SELLER_UI_URL || 'http://localhost:3001';
  }
}