/**
 * Credit Pack Models
 * Type definitions for the credits module
 */

// ==================== Credit Pack ====================

export interface CreditPack {
  id: string;
  name: string;
  displayName: string;
  priceInCents: number;
  currency: string;
  creditsIncluded: number;
  costPerCredit: number;
  // Converted price fields (populated when ?currency= param is used)
  convertedPriceInCents?: number;
  convertedCurrency?: string;
  formattedPrice?: string;
  formattedOriginalPrice?: string;
  exchangeRate?: number;
}

// ==================== Credit Balance ====================

export interface CreditBalance {
  balance: number;
  totalPurchased: number;
  totalUsed: number;
}

// ==================== Credit Purchase ====================

export type CreditGateway = 'STRIPE' | 'PAYSTACK' | 'PAYPAL';

export interface CreditPurchaseRequest {
  creditPackId: string;
  gateway: CreditGateway;
  couponCode?: string;
  callbackUrl?: string;
  cancelUrl?: string;
  currency: string;
}

export interface CreditPurchaseResponse {
  paymentUrl: string;
  reference: string;
  packName: string;
  creditsToReceive: number;
  amountInCents: number;
  discountApplied: number;
  currency: string;
  formattedAmount: string;
  exchangeRate: number;
}

// ==================== Credit Transfer ====================

export interface CreditTransferRequest {
  recipientEmail: string;
  amount: number;
}

export interface CreditTransferResponse {
  transferId: string;
  creditsTransferred: number;
  senderBalanceAfter: number;
  recipientEmail: string;
  recipientName: string;
}

// ==================== Credit Transaction ====================

export type CreditTransactionType =
  | 'PURCHASE'
  | 'DEDUCTION'
  | 'REFUND'
  | 'BONUS'
  | 'ADMIN_ADJUSTMENT'
  | 'TRANSFER_SENT'
  | 'TRANSFER_RECEIVED'
  | 'ADMIN_ALLOCATION';

export interface CreditTransaction {
  transactionId: string;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface CreditTransactionPage {
  content: CreditTransaction[];
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

// ==================== Credit Calculation ====================

export interface CreditCalculation {
  totalPages: number;
  creditsRequired: number;
  currentBalance: number;
  hasEnoughCredits: boolean;
}

// ==================== API Response ====================

export interface CreditApiResponse<T> {
  statusCode: number;
  status: 'success' | 'error';
  message: string;
  data: T;
}

// ==================== Helpers ====================

export const TRANSACTION_TYPE_LABELS: Record<CreditTransactionType, string> = {
  PURCHASE: 'Purchase',
  DEDUCTION: 'Usage',
  REFUND: 'Refund',
  BONUS: 'Bonus',
  ADMIN_ADJUSTMENT: 'Admin Adjustment',
  TRANSFER_SENT: 'Transfer Sent',
  TRANSFER_RECEIVED: 'Transfer Received',
  ADMIN_ALLOCATION: 'Admin Allocation',
};

export const TRANSACTION_TYPE_COLORS: Record<CreditTransactionType, { bg: string; text: string; icon: string }> = {
  PURCHASE: { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-500' },
  DEDUCTION: { bg: 'bg-red-100', text: 'text-red-700', icon: 'text-red-500' },
  REFUND: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'text-blue-500' },
  BONUS: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-500' },
  ADMIN_ADJUSTMENT: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'text-purple-500' },
  TRANSFER_SENT: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'text-orange-500' },
  TRANSFER_RECEIVED: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-500' },
  ADMIN_ALLOCATION: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: 'text-indigo-500' },
};

/**
 * Format cents to currency display string
 */
export function formatCentsToPrice(cents: number, currency: string = 'USD'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Check if a transaction type represents incoming credits
 */
export function isIncomingTransaction(type: CreditTransactionType): boolean {
  return ['PURCHASE', 'REFUND', 'BONUS', 'TRANSFER_RECEIVED', 'ADMIN_ALLOCATION', 'ADMIN_ADJUSTMENT'].includes(type);
}

