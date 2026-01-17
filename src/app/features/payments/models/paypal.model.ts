/**
 * PayPal Payment Models
 * Comprehensive type definitions for PayPal payment integration
 */

// ==================== PayPal Status Types ====================

export type PayPalSubscriptionStatus =
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'EXPIRED';

export type PayPalPlanStatus = 'CREATED' | 'ACTIVE' | 'INACTIVE';

// ==================== PayPal Currencies ====================

export type PayPalCurrency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export const PAYPAL_CURRENCIES: { code: PayPalCurrency; name: string; symbol: string }[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];

// ==================== PayPal Billing Plans ====================

export interface PayPalBillingPlan {
  id: string;
  name: string;
  productId: string;
  status: PayPalPlanStatus;
}

export interface PayPalPlansResponse {
  plans: PayPalBillingPlan[];
}

// ==================== Create Subscription ====================

export interface PayPalCreateSubscriptionRequest {
  planId: string;
  returnUrl?: string;
  cancelUrl?: string;
  customId?: string;
  startTime?: string;
  quantity?: number;
  autoRenewal?: boolean;
}

export interface PayPalCreateSubscriptionResponse {
  subscriptionId: string;
  status: PayPalSubscriptionStatus;
  approvalUrl: string;
}

// ==================== Subscription Details ====================

export interface PayPalBillingInfo {
  outstandingBalance: number;
  currency: string;
  cycleExecutionsCount: number | null;
  failedPaymentsCount: number;
  lastPaymentTime: string | null;
  lastPaymentAmount: number | null;
  nextBillingTime: string | null;
}

export interface PayPalSubscriber {
  name?: {
    givenName: string;
    surname: string;
  };
  emailAddress?: string;
  payerId?: string;
}

export interface PayPalLink {
  href: string;
  rel: string;
  method: string;
}

export interface PayPalSubscriptionDetails {
  id: string;
  planId: string;
  status: PayPalSubscriptionStatus;
  startTime: string | null;
  createTime: string;
  updateTime: string | null;
  approvalUrl: string | null;
  customId: string | null;
  billingInfo: PayPalBillingInfo | null;
  subscriber: PayPalSubscriber | null;
  links: PayPalLink[];
  active: boolean;
  approvalLink: string | null;
  cancelled: boolean;
  pendingApproval: boolean;
  suspended: boolean;
}

// ==================== Subscription History Item ====================

export interface PayPalSubscriptionHistoryItem {
  id: string;
  userId: string;
  userEmail: string;
  subscription_id: string;
  plan_id: string;
  status: PayPalSubscriptionStatus;
  amount: number | null;
  currency: string | null;
  custom_id: string | null;
  start_time: string | null;
  next_billing_time: string | null;
  outstanding_balance: number | null;
  cycles_completed: number | null;
  failed_payments_count: number;
  last_payment_time: string | null;
  last_payment_amount: number | null;
  auto_renewal: boolean;
  cancelled_at: string | null;
  status_change_reason: string | null;
  created_at: string;
  // Normalized aliases for template compatibility
  subscriptionId?: string;
  planId?: string;
  startTime?: string;
  nextBillingTime?: string;
  createdAt?: string;
}

// ==================== Subscription History Response ====================

export interface PayPalSubscriptionHistoryResponse {
  content: PayPalSubscriptionHistoryItem[];
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

// ==================== Subscription Action Responses ====================

export interface PayPalSubscriptionActionResponse {
  subscriptionId: string;
  status: PayPalSubscriptionStatus;
}

// ==================== API Response Wrapper ====================

export interface PayPalApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

// ==================== Utility Functions ====================

/**
 * Get display-friendly status label
 */
export function getPayPalStatusLabel(status: PayPalSubscriptionStatus): string {
  const statusLabels: Record<PayPalSubscriptionStatus, string> = {
    'APPROVAL_PENDING': 'Pending Approval',
    'APPROVED': 'Approved',
    'ACTIVE': 'Active',
    'SUSPENDED': 'Suspended',
    'CANCELLED': 'Cancelled',
    'EXPIRED': 'Expired'
  };
  return statusLabels[status] || status;
}

/**
 * Get status color class
 */
export function getPayPalStatusClass(status: PayPalSubscriptionStatus): string {
  const statusClasses: Record<PayPalSubscriptionStatus, string> = {
    'APPROVAL_PENDING': 'status-pending',
    'APPROVED': 'status-approved',
    'ACTIVE': 'status-active',
    'SUSPENDED': 'status-suspended',
    'CANCELLED': 'status-cancelled',
    'EXPIRED': 'status-expired'
  };
  return statusClasses[status] || 'status-default';
}

/**
 * Check if subscription is in a terminal state
 */
export function isTerminalStatus(status: PayPalSubscriptionStatus): boolean {
  return ['CANCELLED', 'EXPIRED'].includes(status);
}

/**
 * Check if subscription can be cancelled
 */
export function canCancelSubscription(status: PayPalSubscriptionStatus): boolean {
  return ['ACTIVE', 'SUSPENDED', 'APPROVED'].includes(status);
}

/**
 * Check if subscription can be suspended
 */
export function canSuspendSubscription(status: PayPalSubscriptionStatus): boolean {
  return status === 'ACTIVE';
}

/**
 * Check if subscription can be activated/resumed
 */
export function canActivateSubscription(status: PayPalSubscriptionStatus): boolean {
  return status === 'SUSPENDED';
}
