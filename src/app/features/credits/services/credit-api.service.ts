import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreditPack,
  CreditBalance,
  CreditPurchaseRequest,
  CreditPurchaseResponse,
  CreditTransferRequest,
  CreditTransferResponse,
  CreditTransactionPage,
  CreditCalculation,
  CreditApiResponse,
} from '../models/credit.model';

/**
 * Credit API Service
 * Handles all credit-related API calls
 */
@Injectable({
  providedIn: 'root'
})
export class CreditApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/credits`;

  // ==================== Pack Endpoints ====================

  /**
   * Get all available credit packs
   * GET /credits/packs
   * GET /credits/packs?currency=NGN  (with server-side currency conversion)
   */
  getPacks(currency?: string): Observable<CreditPack[]> {
    let params = new HttpParams();
    if (currency && currency !== 'USD') {
      params = params.set('currency', currency);
    }
    return this.http.get<CreditApiResponse<CreditPack[]>>(
      `${this.apiUrl}/packs`,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }

  // ==================== Balance Endpoints ====================

  /**
   * Get current user's credit balance
   * GET /credits/balance
   */
  getBalance(): Observable<CreditBalance> {
    return this.http.get<CreditApiResponse<CreditBalance>>(
      `${this.apiUrl}/balance`
    ).pipe(
      map(response => response.data)
    );
  }

  // ==================== Purchase Endpoints ====================

  /**
   * Purchase a credit pack
   * POST /credits/purchase
   */
  purchasePack(request: CreditPurchaseRequest): Observable<CreditPurchaseResponse> {
    return this.http.post<CreditApiResponse<CreditPurchaseResponse>>(
      `${this.apiUrl}/purchase`,
      request
    ).pipe(
      map(response => response.data)
    );
  }

  // ==================== Transfer Endpoints ====================

  /**
   * Transfer credits to another user
   * POST /credits/transfer
   */
  transferCredits(request: CreditTransferRequest): Observable<CreditTransferResponse> {
    return this.http.post<CreditApiResponse<CreditTransferResponse>>(
      `${this.apiUrl}/transfer`,
      request
    ).pipe(
      map(response => response.data)
    );
  }

  // ==================== Transaction Endpoints ====================

  /**
   * Get credit transaction history
   * GET /credits/transactions
   */
  getTransactions(page: number = 0, size: number = 20): Observable<CreditTransactionPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<CreditApiResponse<CreditTransactionPage>>(
      `${this.apiUrl}/transactions`,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }

  // ==================== Calculate Endpoints ====================

  /**
   * Calculate credit cost for files
   * POST /credits/calculate
   */
  calculateCost(files: File[]): Observable<CreditCalculation> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    return this.http.post<CreditApiResponse<CreditCalculation>>(
      `${this.apiUrl}/calculate`,
      formData
    ).pipe(
      map(response => response.data)
    );
  }
}


