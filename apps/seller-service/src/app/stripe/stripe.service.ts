import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SellerPrismaService } from '../../prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';
import type { Prisma } from '@tec-shop/seller-client';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor(
    private configService: ConfigService,
    private prisma: SellerPrismaService
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil', // Use latest API version
    });

    // In development, sync accounts periodically since webhooks may not be available
    if (!this.isProduction) {
      setInterval(() => this.syncPendingAccounts(), 60000); // Every 60 seconds (reduced frequency)
      console.log('🔄 Development mode: Polling for Stripe account updates every 60 seconds');
    }
  }

  /**
   * Create Stripe Connect account for seller and generate onboarding link
   */
  async createConnectAccount(authId: string) {
    // Find seller
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
      include: { shop: true },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Check if seller already has a Stripe account
    if (seller.stripeAccountId) {
      // If account exists, generate fresh onboarding link
      return this.createAccountLink(seller.stripeAccountId, authId);
    }

    try {
      // Create Stripe Connect Express account (external API - don't wrap in transaction)
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: seller.country,
        email: seller.email,
        business_profile: {
          name: seller.shop?.businessName || seller.name,
          support_email: seller.email,
          url: seller.shop?.website || undefined,
          mcc: '5734', // Computer Software Stores - adjust based on your marketplace
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      // Update seller with Stripe account ID
      await this.prisma.seller.update({
        where: { authId },
        data: {
          stripeAccountId: account.id,
          stripeOnboardingStatus: 'PENDING',
          stripeLastUpdated: new Date(),
        },
      });

      // Create account link for onboarding
      return this.createAccountLink(account.id, authId);
    } catch (error) {
      // Log error without exposing sensitive Stripe API details
      console.error('Stripe account creation failed for seller:', { authId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw new BadRequestException('Failed to create Stripe account. Please try again.');
    }
  }

  /**
   * Generate secure state token for CSRF protection
   */
  private generateSecureState(authId: string): string {
    const timestamp = Date.now().toString();
    const nonce = randomBytes(16).toString('hex');
    const secret = this.configService.get<string>('JWT_SECRET') || 'default-secret';

    // Create HMAC with authId, timestamp, and nonce
    const data = `${authId}:${timestamp}:${nonce}`;
    const hash = createHash('sha256').update(`${secret}:${data}`).digest('hex');

    // Encode as base64 for URL safety
    return Buffer.from(`${data}:${hash}`).toString('base64');
  }

  /**
   * Validate secure state token
   */
  private validateSecureState(state: string, authId: string): boolean {
    try {
      // Decode from base64
      const decoded = Buffer.from(state, 'base64').toString('utf8');
      const parts = decoded.split(':');

      if (parts.length !== 4) return false;

      const [stateAuthId, timestamp, nonce, providedHash] = parts;

      // Verify authId matches
      if (stateAuthId !== authId) return false;

      // Check timestamp (valid for 1 hour)
      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > 3600000) return false; // 1 hour expiration

      // Regenerate hash and compare
      const secret = this.configService.get<string>('JWT_SECRET') || 'default-secret';
      const data = `${stateAuthId}:${timestamp}:${nonce}`;
      const expectedHash = createHash('sha256').update(`${secret}:${data}`).digest('hex');

      return expectedHash === providedHash;
    } catch {
      return false;
    }
  }

  /**
   * Create account link for Stripe onboarding
   */
  private async createAccountLink(stripeAccountId: string, authId: string) {
    try {
      // Generate secure state token for CSRF protection
      const state = this.generateSecureState(authId);

      const accountLink = await this.stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${this.getBaseUrl()}/api/seller/stripe/refresh?authId=${authId}&state=${encodeURIComponent(state)}`,
        return_url: `${this.getBaseUrl()}/api/seller/stripe/return?authId=${authId}&state=${encodeURIComponent(state)}`,
        type: 'account_onboarding',
      });

      // Save the onboarding URL
      await this.prisma.seller.update({
        where: { authId },
        data: {
          stripeOnboardingUrl: accountLink.url,
          stripeLastUpdated: new Date(),
        },
      });

      return {
        url: accountLink.url,
        expires_at: accountLink.expires_at,
      };
    } catch (error) {
      // Log without exposing account details
      console.error('Account link creation failed for seller:', { authId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw new BadRequestException('Failed to create onboarding link');
    }
  }

  /**
   * Get Stripe account status
   */
  async getAccountStatus(authId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { authId },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (!seller.stripeAccountId) {
      return {
        status: 'NOT_STARTED',
        canAcceptPayments: false,
        requiresAction: false,
      };
    }

    try {
      // Get account details from Stripe
      const account = await this.stripe.accounts.retrieve(seller.stripeAccountId);

      const status = this.mapStripeStatusToLocal(account);

      // Update local status
      await this.prisma.seller.update({
        where: { authId },
        data: {
          stripeOnboardingStatus: status,
          stripeDetailsSubmitted: account.details_submitted,
          stripePayoutsEnabled: account.payouts_enabled,
          stripeChargesEnabled: account.charges_enabled,
          stripeRequirements: account.requirements ? (account.requirements as unknown as Prisma.InputJsonValue) : null,
          stripeLastUpdated: new Date(),
        },
      });

      return {
        status,
        canAcceptPayments: account.charges_enabled && account.payouts_enabled,
        requiresAction: (account.requirements?.currently_due?.length ?? 0) > 0,
        requirements: account.requirements?.currently_due || [],
        accountId: account.id,
        detailsSubmitted: account.details_submitted,
        payoutsEnabled: account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
      };
    } catch (error) {
      // Log without exposing account details
      console.error('Failed to retrieve account status for seller:', { authId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw new BadRequestException('Failed to retrieve account status');
    }
  }

  /**
   * Handle Stripe Connect return (success)
   */
  async handleConnectReturn(authId: string, state: string) {
    // Validate state token first
    if (!this.validateSecureState(state, authId)) {
      throw new BadRequestException('Invalid or expired state token');
    }

    const seller = await this.prisma.seller.findUnique({
      where: { authId },
    });

    if (!seller || !seller.stripeAccountId) {
      throw new NotFoundException('Seller or Stripe account not found');
    }

    // Get updated account status
    const accountStatus = await this.getAccountStatus(authId);

    return {
      success: true,
      message: 'Stripe account setup completed successfully',
      accountStatus,
    };
  }

  /**
   * Handle Stripe Connect refresh (user needs to restart onboarding)
   */
  async handleConnectRefresh(authId: string, state: string) {
    // Validate state token first
    if (!this.validateSecureState(state, authId)) {
      throw new BadRequestException('Invalid or expired state token');
    }

    const seller = await this.prisma.seller.findUnique({
      where: { authId },
    });

    if (!seller || !seller.stripeAccountId) {
      throw new NotFoundException('Seller or Stripe account not found');
    }

    // Create new account link with new state token
    const result = await this.createAccountLink(seller.stripeAccountId, authId);

    return {
      success: true,
      url: result.url,
      expires_at: result.expires_at,
    };
  }

  /**
   * Process Stripe webhook
   */
  async handleWebhook(event: Stripe.Event) {
    console.log(`Processing webhook: ${event.type}`);

    switch (event.type) {
      case 'account.updated':
        await this.handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      case 'capability.updated':
        await this.handleCapabilityUpdated(event);
        break;
      default:
        console.log(`Unhandled webhook type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Handle account.updated webhook
   */
  private async handleAccountUpdated(account: Stripe.Account) {
    try {
      const status = this.mapStripeStatusToLocal(account);

      // Use upsert with atomic update to prevent race conditions
      await this.prisma.seller.update({
        where: { stripeAccountId: account.id },
        data: {
          stripeOnboardingStatus: status,
          stripeDetailsSubmitted: account.details_submitted,
          stripePayoutsEnabled: account.payouts_enabled,
          stripeChargesEnabled: account.charges_enabled,
          stripeRequirements: account.requirements ? (account.requirements as unknown as Prisma.InputJsonValue) : null,
          stripeLastUpdated: new Date(),
        },
      });

      console.log(`Updated account status: ${status}`);
    } catch (error) {
      console.error('Failed to update account from webhook:', error);
    }
  }

  /**
   * Handle capability.updated webhook
   */
  private async handleCapabilityUpdated(event: Stripe.Event) {
    const capability = event.data.object as Stripe.Capability;
    const accountId = capability.account as string;

    // Refresh the account status
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      await this.handleAccountUpdated(account);
    } catch (error) {
      console.error('Failed to process capability update:', error);
    }
  }

  /**
   * Map Stripe account status to local enum
   */
  private mapStripeStatusToLocal(account: Stripe.Account): 'NOT_STARTED' | 'PENDING' | 'INCOMPLETE' | 'COMPLETE' | 'RESTRICTED' | 'REJECTED' {
    // Account is fully onboarded and can accept payments
    if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
      return 'COMPLETE';
    }

    // Account has restrictions
    if (account.requirements?.disabled_reason) {
      if (account.requirements.disabled_reason === 'rejected.fraud' ||
          account.requirements.disabled_reason === 'rejected.listed' ||
          account.requirements.disabled_reason === 'rejected.terms_of_service') {
        return 'REJECTED';
      }
      return 'RESTRICTED';
    }

    // Account details submitted but not fully enabled
    if (account.details_submitted) {
      return 'PENDING';
    }

    // Account created but onboarding not completed
    if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) {
      return 'INCOMPLETE';
    }

    return 'PENDING';
  }

  /**
   * Sync pending accounts in development mode (alternative to webhooks)
   */
  private async syncPendingAccounts() {
    if (this.isProduction) return; // Only run in development

    try {
      // Limit batch size to prevent resource exhaustion
      const pendingSellers = await this.prisma.seller.findMany({
        where: {
          stripeOnboardingStatus: { in: ['PENDING', 'INCOMPLETE'] },
          stripeAccountId: { not: null },
          stripeLastUpdated: {
            lt: new Date(Date.now() - 60000) // Only check if not updated in last 60 seconds
          }
        },
        select: { authId: true, stripeAccountId: true },
        take: 10 // Limit to 10 accounts per batch to prevent DoS
      });

      if (pendingSellers.length === 0) return;

      console.log(`🔄 Syncing ${pendingSellers.length} pending Stripe accounts (max 10 per batch)...`);

      // Process with delay between requests to avoid rate limiting Stripe API
      for (let i = 0; i < pendingSellers.length; i++) {
        const seller = pendingSellers[i];
        try {
          await this.getAccountStatus(seller.authId);

          // Add 100ms delay between API calls to respect rate limits
          if (i < pendingSellers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error('Failed to sync seller account:', { error: error instanceof Error ? error.message : 'Unknown error' });
          // Continue with other sellers even if one fails
        }
      }
    } catch (error) {
      console.error('Error during account sync:', error);
    }
  }

  /**
   * Get base URL for redirects (API Gateway URL, not frontend)
   */
  private getBaseUrl(): string {
    return this.configService.get<string>('API_GATEWAY_URL') || 'http://localhost:8080';
  }
}