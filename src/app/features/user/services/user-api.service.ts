import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  UserProfile,
  UpdateProfileRequest,
  StorageInfo,
  Subscription,
  Team,
  RecentCollection,
  ChangePasswordRequest,
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ==================== Profile ====================

  /**
   * Get current user profile
   */
  getProfile(): Observable<UserProfile> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/user/me`)
      .pipe(map(response => this.mapToUserProfile(response.data)));
  }

  /**
   * Map backend response to UserProfile model
   */
  private mapToUserProfile(data: any): UserProfile {
    return {
      id: data.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      profilePicture: data.profilePicture || undefined,
      phoneNumber: data.phoneNumber || undefined,
      country: data.country || undefined,
      profession: data.profession || undefined,
      organization: data.organization || undefined,
      role: (data.role?.toUpperCase() as UserProfile['role']) || 'USER',
      isVerified: data.verified ?? data.isVerified ?? false,
      isActive: data.isActive ?? true,
      lastLogin: data.lastLogin,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /**
   * Update user profile
   */
  updateProfile(userId: string, data: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/user/profile/${userId}`, data)
      .pipe(map(response => this.mapToUserProfile(response.data)));
  }

  /**
   * Upload profile picture
   */
  uploadProfilePicture(userId: string, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/user/profile/${userId}/upload`, formData)
      .pipe(map(response => response.data));
  }

  /**
   * Delete profile picture
   */
  deleteProfilePicture(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/user/profile/${userId}/delete`);
  }

  // ==================== Dashboard Stats ====================

  /**
   * Get storage information from the API
   */
  getStorageInfo(): Observable<StorageInfo> {
    return this.http.get<ApiResponse<StorageInfo>>(`${this.apiUrl}/storage`)
      .pipe(map(response => response.data));
  }

  // ==================== Subscription ====================

  /**
   * Get current subscription
   */
  getSubscription(): Observable<Subscription> {
    return this.http.get<ApiResponse<Subscription>>(`${this.apiUrl}/subscriptions/current`)
      .pipe(map(response => response.data));
  }

  // ==================== Teams ====================

  /**
   * Get user's teams
   */
  getTeams(): Observable<Team[]> {
    return this.http.get<ApiResponse<Team[]>>(`${this.apiUrl}/teams/my`)
      .pipe(map(response => response.data));
  }

  // ==================== Documents ====================

  /**
   * Get user collections
   */
  getCollections(): Observable<RecentCollection[]> {
    return this.http.get<ApiResponse<RecentCollection[]>>(`${this.apiUrl}/documents/my-collections`)
      .pipe(map(response => response.data || []));
  }

  // ==================== Billing ====================

  /**
   * Add payment method
   */
  addPaymentMethod(paymentMethodId: string): Observable<void> {
    const params = new HttpParams().set('paymentMethodId', paymentMethodId);
    return this.http.post<void>(`${this.apiUrl}/stripe/customer/payment-method/attach`, null, { params });
  }

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod(paymentMethodId: string): Observable<void> {
    const params = new HttpParams().set('paymentMethodId', paymentMethodId);
    return this.http.post<void>(`${this.apiUrl}/stripe/customer/payment-method/set-default`, null, { params });
  }

  // ==================== Security ====================

  /**
   * Change password
   */
  changePassword(data: ChangePasswordRequest): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/user/change-password`, data)
      .pipe(map(() => undefined));
  }

  /**
   * Enable two-factor authentication
   */
  enableTwoFactor(method: string): Observable<{ secret: string; qrCode: string }> {
    return this.http.post<ApiResponse<{ secret: string; qrCode: string }>>(
      `${this.apiUrl}/user/security/2fa/enable`,
      { method }
    ).pipe(map(response => response.data));
  }

  /**
   * Disable two-factor authentication
   */
  disableTwoFactor(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/user/security/2fa/disable`, {});
  }

  /**
   * Revoke session
   */
  revokeSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/user/security/sessions/${sessionId}`);
  }

  /**
   * Revoke all other sessions
   */
  revokeAllOtherSessions(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/user/security/sessions`);
  }
}

