/**
 * Payment Models
 * Type definitions for the payments module
 */

// ==================== Payment Status ====================

export type PaymentStatus =
  | 'succeeded'
  | 'pending'
  | 'failed'
  | 'refunded'
  | 'canceled'
  | 'processing';

export type PaymentProvider = 'stripe' | 'paystack';

export type PaymentMethodType = 'card' | 'bank_account' | 'bank_transfer';

// ==================== Payment ====================

export interface Payment {
  id: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  paymentMethodId?: string;
  paymentMethodBrand?: string;
  paymentMethodLast4?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  refundedAmount?: number;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
}

// ==================== Payment Method ====================

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  provider: PaymentProvider;
  brand?: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  isDefault: boolean;
  createdAt: string;
}

// ==================== Receipt ====================

export interface Receipt {
  id: string;
  receiptNumber: string;
  paymentProvider: PaymentProvider;
  amount: number;
  currency: string;
  paymentMethod?: string;
  description?: string;
  receiptUrl?: string;
  paidAt: string;
  createdAt: string;
}

// ==================== Stripe Types ====================

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
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

export interface StripeRefund {
  refundId: string;
  amount: number;
  status: string;
}

// ==================== Paystack Types ====================

export interface PaystackTransaction {
  reference: string;
  amount: number;
  currency: string;
  status: string;
  authorizationUrl?: string;
  accessCode?: string;
}

export interface PaystackAuthorization {
  authorizationCode: string;
  bin: string;
  last4: string;
  expMonth: string;
  expYear: string;
  channel: string;
  cardType: string;
  bank: string;
  countryCode: string;
  brand: string;
  reusable: boolean;
}

// ==================== API Responses ====================

export interface PaymentApiResponse<T> {
  statusCode: number;
  status: 'success' | 'error';
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ==================== Create Payment Intent ====================

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

// ==================== Refund Request ====================

export interface RefundRequest {
  paymentIntentId: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

// ==================== Paystack Initialize ====================

export interface PaystackInitializeRequest {
  amount: number;
  email: string;
  currency?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitializeResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

// ==================== View State ====================

export interface PaymentsViewState {
  payments: Payment[];
  paymentMethods: PaymentMethod[];
  receipts: Receipt[];
  selectedPayment: Payment | null;
  selectedReceipt: Receipt | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  successMessage: string | null;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

// ==================== Filter Options ====================

export interface PaymentFilterOptions {
  status?: PaymentStatus;
  provider?: PaymentProvider;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

