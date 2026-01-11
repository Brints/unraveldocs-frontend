import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Device,
  RegisterDeviceRequest,
  PaginatedNotifications,
  UnreadCountResponse,
  NotificationPreferences,
  UpdatePreferencesRequest,
  NotificationType,
} from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  // ==================== Device Management ====================

  /**
   * Register a device to receive push notifications
   * POST /api/v1/notifications/device
   */
  registerDevice(request: RegisterDeviceRequest): Observable<Device> {
    return this.http.post<Device>(`${this.apiUrl}/device`, request);
  }

  /**
   * Unregister a device from push notifications
   * DELETE /api/v1/notifications/device/{tokenId}
   */
  unregisterDevice(tokenId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/device/${tokenId}`);
  }

  /**
   * Get all registered devices for the current user
   * GET /api/v1/notifications/devices
   */
  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.apiUrl}/devices`);
  }

  // ==================== Notifications ====================

  /**
   * Get paginated list of all notifications
   * GET /api/v1/notifications
   */
  getNotifications(page = 0, size = 20): Observable<PaginatedNotifications> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedNotifications>(this.apiUrl, { params });
  }

  /**
   * Get paginated list of unread notifications
   * GET /api/v1/notifications/unread
   */
  getUnreadNotifications(page = 0, size = 20): Observable<PaginatedNotifications> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedNotifications>(`${this.apiUrl}/unread`, { params });
  }

  /**
   * Get notifications filtered by type
   * GET /api/v1/notifications/by-type/{type}
   */
  getNotificationsByType(
    type: NotificationType,
    page = 0,
    size = 20
  ): Observable<PaginatedNotifications> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedNotifications>(
      `${this.apiUrl}/by-type/${type}`,
      { params }
    );
  }

  /**
   * Get the count of unread notifications
   * GET /api/v1/notifications/unread-count
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`);
  }

  /**
   * Mark a specific notification as read
   * PATCH /api/v1/notifications/{id}/read
   */
  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  /**
   * Mark all notifications as read
   * PATCH /api/v1/notifications/read-all
   */
  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/read-all`, {});
  }

  /**
   * Delete a specific notification
   * DELETE /api/v1/notifications/{id}
   */
  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`);
  }

  // ==================== Preferences ====================

  /**
   * Get notification preferences
   * GET /api/v1/notifications/preferences
   */
  getPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.apiUrl}/preferences`);
  }

  /**
   * Update notification preferences
   * PUT /api/v1/notifications/preferences
   */
  updatePreferences(preferences: UpdatePreferencesRequest): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(
      `${this.apiUrl}/preferences`,
      preferences
    );
  }
}

