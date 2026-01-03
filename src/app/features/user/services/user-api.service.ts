import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  UserProfile,
  UpdateProfileRequest,
  DashboardStats,
  Activity,
  Notification,
  Subscription,
  Team,
  DocumentSummary,
  PaymentMethod,
  Invoice,
  SecuritySettings,
  ChangePasswordRequest,
  NotificationPreferences,
  PaginatedResponse,
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

  /**
   * Delete user account
   */
  deleteAccount(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/user/profile/${userId}`);
  }

  // ==================== Dashboard Stats ====================

  /**
   * Get dashboard statistics
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.apiUrl}/user/dashboard/stats`)
      .pipe(map(response => response.data));
  }

  // ==================== Activities ====================

  /**
   * Get recent activities
   */
  getActivities(page = 0, size = 10): Observable<PaginatedResponse<Activity>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PaginatedResponse<Activity>>>(
      `${this.apiUrl}/user/activities`,
      { params }
    ).pipe(map(response => response.data));
  }

  // ==================== Notifications ====================

  /**
   * Get notifications
   */
  getNotifications(page = 0, size = 20): Observable<PaginatedResponse<Notification>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PaginatedResponse<Notification>>>(
      `${this.apiUrl}/user/notifications`,
      { params }
    ).pipe(map(response => response.data));
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/user/notifications/${notificationId}/read`, {});
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/user/notifications/read-all`, {});
  }

  /**
   * Get notification preferences
   */
  getNotificationPreferences(): Observable<NotificationPreferences> {
    return this.http.get<ApiResponse<NotificationPreferences>>(`${this.apiUrl}/user/notifications/preferences`)
      .pipe(map(response => response.data));
  }

  /**
   * Update notification preferences
   */
  updateNotificationPreferences(preferences: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.put<ApiResponse<NotificationPreferences>>(
      `${this.apiUrl}/user/notifications/preferences`,
      preferences
    ).pipe(map(response => response.data));
  }

  // ==================== Subscription ====================

  /**
   * Get current subscription
   */
  getSubscription(): Observable<Subscription> {
    return this.http.get<ApiResponse<Subscription>>(`${this.apiUrl}/subscriptions/current`)
      .pipe(map(response => response.data));
  }

  /**
   * Get available plans
   */
  getAvailablePlans(): Observable<Subscription[]> {
    return this.http.get<ApiResponse<Subscription[]>>(`${this.apiUrl}/subscriptions/plans`)
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
   * Get document summary for dashboard
   */
  getDocumentSummary(): Observable<DocumentSummary> {
    return this.http.get<ApiResponse<DocumentSummary>>(`${this.apiUrl}/documents/summary`)
      .pipe(map(response => response.data));
  }

  /**
   * Get user collections
   */
  getCollections(): Observable<unknown[]> {
    return this.http.get<ApiResponse<unknown[]>>(`${this.apiUrl}/documents/my-collections`)
      .pipe(map(response => response.data));
  }

  // ==================== Billing ====================

  /**
   * Get payment methods
   */
  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<ApiResponse<PaymentMethod[]>>(`${this.apiUrl}/stripe/customer/details`)
      .pipe(map(response => response.data as unknown as PaymentMethod[]));
  }

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

  /**
   * Get invoices/payment history
   */
  getInvoices(page = 0, size = 10): Observable<PaginatedResponse<Invoice>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PaginatedResponse<Invoice>>>(
      `${this.apiUrl}/stripe/payment/history`,
      { params }
    ).pipe(map(response => response.data));
  }

  // ==================== Security ====================

  /**
   * Get security settings
   */
  getSecuritySettings(): Observable<SecuritySettings> {
    return this.http.get<ApiResponse<SecuritySettings>>(`${this.apiUrl}/user/security`)
      .pipe(map(response => response.data));
  }

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
   * Get login history
   */
  getLoginHistory(page = 0, size = 10): Observable<PaginatedResponse<unknown>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<PaginatedResponse<unknown>>>(
      `${this.apiUrl}/user/security/login-history`,
      { params }
    ).pipe(map(response => response.data));
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): Observable<unknown[]> {
    return this.http.get<ApiResponse<unknown[]>>(`${this.apiUrl}/user/security/sessions`)
      .pipe(map(response => response.data));
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

