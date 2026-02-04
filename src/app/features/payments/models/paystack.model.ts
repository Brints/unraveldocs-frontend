/**
 * Paystack Payment Models
 * Comprehensive type definitions for Paystack payment integration
 */

// ==================== Paystack Status Types ====================

export type PaystackTransactionStatus =
  | 'success'
  | 'failed'
  | 'abandoned'
  | 'pending'
  | 'reversed'
  | 'queued';

export type PaystackSubscriptionStatus =
  | 'active'
  | 'non-renewing'
  | 'attention'
  | 'completed'
  | 'cancelled';

export type PaystackChannel =
  | 'card'
  | 'bank'
  | 'ussd'
  | 'qr'
  | 'mobile_money'
  | 'bank_transfer'
  | 'eft';

// ==================== Paystack Currencies ====================

export type PaystackCurrency = 'NGN' | 'GHS' | 'ZAR' | 'KES' | 'USD';

export const PAYSTACK_CURRENCIES: { code: PaystackCurrency; name: string; symbol: string }[] = [
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
];

// ==================== Initialize Transaction ====================

export interface PaystackInitializeRequest {
  email: string;
  amount: number; // Amount in kobo (lowest currency unit)
  callback_url?: string;
  reference?: string;
  currency?: PaystackCurrency;
  planCode?: string;
  coupon_code?: string;
  subscriptionStartDate?: string;
  channels?: PaystackChannel[];
  metadata?: Record<string, unknown>;
  subaccount?: string;
  splitCode?: string;
  bearer?: 'account' | 'subaccount';
}

export interface PaystackInitializeResponse {
  // Support both camelCase and snake_case from API
  authorizationUrl?: string;
  authorization_url?: string;
  accessCode?: string;
  access_code?: string;
  reference: string;
}

// ==================== Verify Transaction ====================

export interface PaystackCustomer {
  id: number;
  email: string;
  customerCode: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface PaystackAuthorization {
  authorizationCode: string;
  bin: string;
  last4: string;
  expMonth: string;
  expYear: string;
  channel: PaystackChannel;
  cardType: string;
  bank: string;
  countryCode: string;
  brand: string;
  reusable: boolean;
  signature: string;
  accountName?: string;
}

export interface PaystackVerifyResponse {
  id: number;
  domain: string;
  status: PaystackTransactionStatus;
  reference: string;
  amount: number;
  message?: string;
  gatewayResponse: string;
  paidAt?: string;
  createdAt: string;
  channel: PaystackChannel;
  currency: PaystackCurrency;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  customer: PaystackCustomer;
  authorization?: PaystackAuthorization;
  plan?: string;
  fees?: number;
  feesSplit?: unknown;
  requestedAmount: number;
  transactionDate: string;
}

// ==================== Charge Authorization ====================

export interface PaystackChargeAuthorizationRequest {
  authorizationCode: string;
  amount: number;
  currency?: PaystackCurrency;
  email?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

// ==================== Payment History ====================

export interface PaystackPaymentHistoryItem {
  id: string;
  userId: string;
  userEmail: string;
  transaction_id: string | null;
  reference: string;
  plan_code: string | null;
  subscription_code: string | null;
  payment_type: 'ONE_TIME' | 'SUBSCRIPTION';
  status: string; // 'PENDING', 'SUCCESS', 'FAILED', etc.
  amount: number;
  currency: PaystackCurrency;
  amount_refunded: number | null;
  fees: number | null;
  channel: PaystackChannel | null;
  gateway_response: string | null;
  description: string | null;
  failure_message: string | null;
  paid_at: string | null;
  created_at: string;
  // Normalized aliases (populated after normalization)
  paidAt?: string;
  createdAt: string;
}

export interface PaystackPaymentHistoryResponse {
  content: PaystackPaymentHistoryItem[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
  };
  size: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  totalElements: number;
  totalPages: number;
}

// ==================== Subscriptions ====================

export interface PaystackSubscriptionRequest {
  customer: string; // Customer email or code
  planName: string;
  authorization?: string;
  startDate?: string;
}

export interface PaystackSubscription {
  id: string;
  subscriptionCode: string;
  status: PaystackSubscriptionStatus;
  emailToken: string;
  amount: number;
  nextPaymentDate?: string;
  createdAt: string;
  planCode?: string;
  planName?: string;
}

export interface PaystackSubscriptionHistoryResponse {
  content: PaystackSubscription[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

// ==================== API Response Wrapper ====================

export interface PaystackApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

// ==================== Utility Functions ====================

/**
 * Convert amount to kobo (lowest currency unit)
 * For NGN: 1 Naira = 100 kobo
 * For USD: 1 Dollar = 100 cents
 * Removes unnecessary decimals (e.g., 13950.00 becomes 13950)
 */
export function toKobo(amount: number): number {
  // Multiply by 100 and truncate any floating point errors
  const koboAmount = Math.round(amount * 100);
  // Return as integer (no decimals)
  return Math.trunc(koboAmount);
}

/**
 * Convert from kobo to main currency unit
 */
export function fromKobo(amountInKobo: number): number {
  return amountInKobo / 100;
}


