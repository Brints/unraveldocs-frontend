/**
 * Coupon/Promo Code Models
 */

export type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface CouponValidationRequest {
  code: string;
  planId: string;
  currency?: string;
}

export interface CouponDetails {
  code: string;
  type: CouponType;
  value: number; // Percentage (0-100) or fixed amount
  description?: string;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  expiresAt?: string;
  usageLimit?: number;
  usageCount?: number;
  applicablePlans?: string[]; // Plan IDs this coupon applies to, empty = all plans
}

export interface CouponValidationResponse {
  valid: boolean;
  coupon?: CouponDetails;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  message?: string;
  errorCode?: string;
}

export interface AppliedCoupon {
  code: string;
  type: CouponType;
  value: number;
  description?: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
}
