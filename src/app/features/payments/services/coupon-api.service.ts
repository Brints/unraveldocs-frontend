import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CouponValidationResponse,
  CouponApplyRequest,
  CouponApplyResponse,
  CouponApplyData,
  AvailableCouponsResponse,
  AvailableCoupon,
  CouponValidationData,
} from '../models/coupon.model';

/**
 * Coupon API Service
 * Handles all coupon-related API calls
 */
@Injectable({
  providedIn: 'root'
})
export class CouponApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/coupons`;

  // ==================== Validation Endpoints ====================

  /**
   * Validate a coupon code for the current user
   * GET /coupons/validate/{code}
   */
  validateCoupon(code: string): Observable<CouponValidationData> {
    return this.http.get<CouponValidationResponse>(
      `${this.apiUrl}/validate/${encodeURIComponent(code)}`
    ).pipe(
      map(response => response.data)
    );
  }

  // ==================== Apply Endpoints ====================

  /**
   * Apply a coupon to calculate discount
   * POST /coupons/apply
   */
  applyCoupon(couponCode: string, amount: number): Observable<CouponApplyData> {
    const request: CouponApplyRequest = {
      couponCode,
      amount
    };

    return this.http.post<CouponApplyResponse>(
      `${this.apiUrl}/apply`,
      request
    ).pipe(
      map(response => response.data)
    );
  }

  // ==================== Available Coupons Endpoints ====================

  /**
   * Get all coupons available for the current user
   * GET /coupons/available
   */
  getAvailableCoupons(): Observable<AvailableCoupon[]> {
    return this.http.get<AvailableCouponsResponse>(
      `${this.apiUrl}/available`
    ).pipe(
      map(response => response.data.coupons)
    );
  }
}
