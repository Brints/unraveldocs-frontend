/**
 * Coupon Models
 * TypeScript interfaces for coupon API responses and state management
 */

// ==================== API Response Types ====================

/**
 * Generic API response wrapper
 */
export interface CouponApiResponse<T> {
  statusCode: number;
  status: string;
  message: string;
  data: T;
}

/**
 * Coupon data structure from API
 */
export interface CouponData {
  id: string;
  code: string;
  description: string | null;
  recipientCategory: 'ALL_USERS' | 'NEW_USERS' | 'ALL_PAID_USERS' | 'SPECIFIC_USERS' | 'EXPIRED_SUBSCRIPTION';
  discountPercentage: number;
  minPurchaseAmount: number | null;
  maxUsageCount: number | null;
  maxUsagePerUser: number | null;
  currentUsageCount: number;
  validFrom: string;
  validUntil: string;
  templateId: string | null;
  templateName: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string | null;
  updatedAt: string | null;
  active: boolean;
  currentlyValid: boolean;
  customCode: boolean;
  expired: boolean;
}

/**
 * Coupon validation response data
 */
export interface CouponValidationData {
  message: string;
  couponData: CouponData | null;
  errorCode: CouponErrorCode | null;
  valid: boolean;
}

/**
 * Coupon validation API response
 */
export interface CouponValidationResponse {
  statusCode: number;
  status: string;
  message: string;
  data: CouponValidationData;
}

/**
 * Coupon apply request body
 */
export interface CouponApplyRequest {
  couponCode: string;
  amount: number;
}

/**
 * Coupon apply response data
 */
export interface CouponApplyData {
  couponCode: string;
  originalAmount: number;
  discountPercentage: number;
  discountAmount: number;
  finalAmount: number;
  currency: string | null;
  minPurchaseAmount: number | null;
  minPurchaseRequirementMet: boolean;
}

/**
 * Coupon apply API response
 */
export interface CouponApplyResponse {
  statusCode: number;
  status: string;
  message: string;
  data: CouponApplyData;
}

/**
 * Available coupon summary (for user display)
 */
export interface AvailableCoupon {
  code: string;
  description: string;
  discountPercentage: number;
  validUntil: string;
}

/**
 * Available coupons response data
 */
export interface AvailableCouponsData {
  coupons: AvailableCoupon[];
  count: number;
}

/**
 * Available coupons API response
 */
export interface AvailableCouponsResponse {
  status: string;
  data: AvailableCouponsData;
}

// ==================== Error Codes ====================

/**
 * Coupon error codes
 */
export type CouponErrorCode =
  | 'COUPON_NOT_FOUND'
  | 'COUPON_EXPIRED'
  | 'COUPON_NOT_YET_VALID'
  | 'COUPON_INACTIVE'
  | 'COUPON_MAX_USAGE_REACHED'
  | 'COUPON_USER_MAX_USAGE_REACHED'
  | 'COUPON_NOT_ELIGIBLE'
  | 'MIN_PURCHASE_NOT_MET'
  | 'INVALID_REQUEST';

/**
 * Get human-readable error message for coupon error codes
 */
export function getCouponErrorMessage(errorCode: CouponErrorCode | null): string {
  if (!errorCode) return 'Invalid coupon code';

  const errorMessages: Record<CouponErrorCode, string> = {
    COUPON_NOT_FOUND: 'Coupon code not found',
    COUPON_EXPIRED: 'This coupon has expired',
    COUPON_NOT_YET_VALID: 'This coupon is not yet valid',
    COUPON_INACTIVE: 'This coupon is no longer active',
    COUPON_MAX_USAGE_REACHED: 'This coupon has reached its maximum usage limit',
    COUPON_USER_MAX_USAGE_REACHED: 'You have already used this coupon the maximum number of times',
    COUPON_NOT_ELIGIBLE: 'You are not eligible to use this coupon',
    MIN_PURCHASE_NOT_MET: 'Minimum purchase amount not met for this coupon',
    INVALID_REQUEST: 'Invalid request'
  };

  return errorMessages[errorCode] || 'Invalid coupon code';
}

// ==================== State Types ====================

/**
 * Coupon validation status
 */
export type CouponValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid' | 'applying' | 'applied' | 'error';

/**
 * Applied coupon state
 */
export interface AppliedCouponState {
  code: string;
  discountPercentage: number;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  minPurchaseAmount: number | null;
  minPurchaseRequirementMet: boolean;
}
