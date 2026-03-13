import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CouponValidationRequest, CouponValidationResponse } from '../models/coupon.model';

interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Promo Code API Service
 * Handles promo code validation and application
 */
@Injectable({
  providedIn: 'root'
})
export class CouponApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/coupons`;

  /**
   * Validate a coupon code
   * POST /coupons/validate
   */
  validateCoupon(request: CouponValidationRequest): Observable<CouponValidationResponse> {
    return this.http.post<ApiResponse<CouponValidationResponse>>(
      `${this.apiUrl}/validate`,
      request
    ).pipe(
      map(response => response.data)
    );
  }
}
