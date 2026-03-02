export enum StripeStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  INCOMPLETE = 'INCOMPLETE',
  COMPLETE = 'COMPLETE',
  RESTRICTED = 'RESTRICTED',
  REJECTED = 'REJECTED',
}

export class Seller {
  id: string;
  authId: string;
  name: string;
  email: string;
  phoneNumber: string;
  country: string;
  isVerified: boolean;
  stripeAccountId: string | null;
  stripeOnboardingStatus: StripeStatus;
  stripeDetailsSubmitted: boolean;
  stripePayoutsEnabled: boolean;
  stripeChargesEnabled: boolean;
  stripeOnboardingUrl: string | null;
  stripeRequirements: Record<string, unknown> | null;
  stripeLastUpdated: Date | null;
  notificationPreferences: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
