/**
 * Subscription Models
 * Type definitions for the subscription module
 */

// ==================== Plan Types ====================

export type PlanInterval = 'monthly' | 'yearly' | 'one_time';
export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'paused'
  | 'incomplete'
  | 'incomplete_expired';

export type PaymentProvider = 'stripe' | 'paystack';

// ==================== Subscription Plan ====================

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  tier: PlanTier;
  price: number;
  currency: string;
  interval: PlanInterval;
  stripePriceId?: string;
  paystackPlanCode?: string;
  features: PlanFeature[];
  limits: PlanLimits;
  isPopular?: boolean;
  isActive: boolean;
  trialDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeature {
  id: string;
  name: string;
  description?: string;
  included: boolean;
  limit?: number;
}

export interface PlanLimits {
  documentsPerMonth: number;
  ocrPagesPerMonth: number;
  storageGb: number;
  teamMembers: number;
  apiCallsPerDay: number;
  retentionDays: number;
}

// ==================== User Subscription ====================

export interface UserSubscription {
  id: string;
  planId: string;
  planName: string;
  planTier: PlanTier;
  status: SubscriptionStatus;
  provider: PaymentProvider;
  providerSubscriptionId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  trialStart?: string;
  trialEnd?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Payment Method ====================

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  brand?: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: string;
}

// ==================== Invoice/Receipt ====================

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'draft' | 'void' | 'uncollectible';
  provider: PaymentProvider;
  description?: string;
  invoiceUrl?: string;
  pdfUrl?: string;
  paidAt?: string;
  createdAt: string;
}

// ==================== Checkout ====================

export interface CheckoutSession {
  sessionId: string;
  url: string;
  customerId?: string;
  expiresAt: number;
}

export interface CreateCheckoutRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  quantity?: number;
  trialPeriodDays?: number;
  promoCode?: string;
}

export interface CreateSubscriptionRequest {
  priceId: string;
  paymentMethodId: string;
  trialDays?: number;
}

// ==================== Usage ====================

export interface SubscriptionUsage {
  documentsUsed: number;
  documentsLimit: number;
  ocrPagesUsed: number;
  ocrPagesLimit: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
  teamMembersUsed: number;
  teamMembersLimit: number;
  periodStart: string;
  periodEnd: string;
}

// ==================== API Responses ====================

export interface SubscriptionApiResponse<T> {
  statusCode: number;
  status: 'success' | 'error';
  message: string;
  data: T;
}

// ==================== Trial ====================

export interface TrialActivationResponse {
  statusCode: number;
  status: 'success' | 'error';
  message: string;
  data: null;
}

export interface UserSubscriptionDetails {
  subscriptionId: string;
  status: 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due';
  planId: string;
  planName: string;
  planDisplayName: string;
  planPrice: number;
  currency: string;
  billingInterval: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  isOnTrial: boolean;
  trialEndsAt?: string | null;
  hasUsedTrial: boolean;
  trialDaysRemaining?: number;
  storageLimit: number;
  storageUsed: number;
  documentUploadLimit: number;
  documentsUploaded: number;
  ocrPageLimit: number;
  ocrPagesUsed: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== Storage Info ====================

export interface StorageInfo {
  storageUsed: number;
  storageLimit: number;
  storageUsedFormatted: string;
  storageLimitFormatted: string;
  percentageUsed: number;
  ocrPageLimit: number;
  ocrPagesUsed: number;
  ocrPagesRemaining: number;
  ocrUnlimited: boolean;
  documentUploadLimit: number;
  documentsUploaded: number;
  documentsRemaining: number;
  documentsUnlimited: boolean;
  subscriptionPlan: string;
  billingInterval: string;
  quotaResetDate: string | null;
  documentQuotaExceeded: boolean;
  ocrQuotaExceeded: boolean;
  quotaExceeded: boolean;
  remainingStorage: number;
  unlimited: boolean;
}

// ==================== Paystack Specific ====================

export interface PaystackInitializeResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface PaystackSubscription {
  subscriptionCode: string;
  emailToken: string;
  status: string;
}

// ==================== Stripe Specific ====================

export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  defaultPaymentMethod?: string;
  paymentMethods: PaymentMethod[];
}

export interface StripePaymentIntent {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

// ==================== View State ====================

export interface SubscriptionViewState {
  plans: SubscriptionPlan[];
  currentSubscription: UserSubscription | null;
  usage: SubscriptionUsage | null;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  successMessage: string | null;
}

// ==================== Default Plans ====================

export const DEFAULT_PLANS: Partial<SubscriptionPlan>[] = [
  {
    name: 'Free',
    tier: 'free',
    price: 0,
    currency: 'USD',
    interval: 'monthly',
    description: 'Perfect for trying out UnravelDocs',
    isPopular: false,
    features: [
      { id: 'f1', name: '50 Documents/month', included: true },
      { id: 'f2', name: '100 OCR Pages/month', included: true },
      { id: 'f3', name: '1 GB Storage', included: true },
      { id: 'f4', name: 'Basic Support', included: true },
      { id: 'f5', name: 'API Access', included: false },
      { id: 'f6', name: 'Team Collaboration', included: false },
      { id: 'f7', name: 'Priority Processing', included: false },
    ],
    limits: {
      documentsPerMonth: 50,
      ocrPagesPerMonth: 100,
      storageGb: 1,
      teamMembers: 1,
      apiCallsPerDay: 100,
      retentionDays: 30
    }
  },
  {
    name: 'Starter',
    tier: 'starter',
    price: 9.99,
    currency: 'USD',
    interval: 'monthly',
    description: 'For individuals and small projects',
    isPopular: false,
    features: [
      { id: 'f1', name: '200 Documents/month', included: true },
      { id: 'f2', name: '500 OCR Pages/month', included: true },
      { id: 'f3', name: '5 GB Storage', included: true },
      { id: 'f4', name: 'Email Support', included: true },
      { id: 'f5', name: 'API Access', included: true },
      { id: 'f6', name: 'Team Collaboration', included: false },
      { id: 'f7', name: 'Priority Processing', included: false },
    ],
    limits: {
      documentsPerMonth: 200,
      ocrPagesPerMonth: 500,
      storageGb: 5,
      teamMembers: 1,
      apiCallsPerDay: 500,
      retentionDays: 90
    }
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: 29.99,
    currency: 'USD',
    interval: 'monthly',
    description: 'For growing teams and businesses',
    isPopular: true,
    features: [
      { id: 'f1', name: 'Unlimited Documents', included: true },
      { id: 'f2', name: '2,000 OCR Pages/month', included: true },
      { id: 'f3', name: '50 GB Storage', included: true },
      { id: 'f4', name: 'Priority Support', included: true },
      { id: 'f5', name: 'API Access', included: true },
      { id: 'f6', name: 'Up to 10 Team Members', included: true },
      { id: 'f7', name: 'Priority Processing', included: true },
    ],
    limits: {
      documentsPerMonth: -1,
      ocrPagesPerMonth: 2000,
      storageGb: 50,
      teamMembers: 10,
      apiCallsPerDay: 5000,
      retentionDays: 365
    }
  },
  {
    name: 'Enterprise',
    tier: 'enterprise',
    price: 99.99,
    currency: 'USD',
    interval: 'monthly',
    description: 'For large organizations with custom needs',
    isPopular: false,
    features: [
      { id: 'f1', name: 'Unlimited Documents', included: true },
      { id: 'f2', name: 'Unlimited OCR Pages', included: true },
      { id: 'f3', name: 'Unlimited Storage', included: true },
      { id: 'f4', name: '24/7 Dedicated Support', included: true },
      { id: 'f5', name: 'Full API Access', included: true },
      { id: 'f6', name: 'Unlimited Team Members', included: true },
      { id: 'f7', name: 'Priority Processing', included: true },
      { id: 'f8', name: 'Custom Integrations', included: true },
      { id: 'f9', name: 'SLA Guarantee', included: true },
    ],
    limits: {
      documentsPerMonth: -1,
      ocrPagesPerMonth: -1,
      storageGb: -1,
      teamMembers: -1,
      apiCallsPerDay: -1,
      retentionDays: -1
    }
  }
];

