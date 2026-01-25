/**
 * Coupon/Promo Code Models
 */

export type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type CouponStatus = 'ACTIVE' | 'EXPIRED' | 'USED' | 'INVALID';

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

/**
 * Helper function to format coupon discount description
 */
export function formatCouponDiscount(coupon: CouponDetails): string {
  if (coupon.type === 'PERCENTAGE') {
    return `${coupon.value}% off`;
  } else {
    return `$${coupon.value.toFixed(2)} off`;
  }
}

/**
 * Calculate discount amount from coupon
 */
export function calculateDiscount(
  coupon: CouponDetails,
  originalAmount: number
): number {
  let discount: number;

  if (coupon.type === 'PERCENTAGE') {
    discount = originalAmount * (coupon.value / 100);
  } else {
    discount = coupon.value;
  }

  // Apply max discount cap if set
  if (coupon.maxDiscountAmount != null && discount > coupon.maxDiscountAmount) {
    discount = coupon.maxDiscountAmount;
  }

  // Ensure discount doesn't exceed original amount
  return Math.min(discount, originalAmount);
}
