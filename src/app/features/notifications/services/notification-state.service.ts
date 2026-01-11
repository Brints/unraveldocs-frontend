import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, of, tap, finalize, interval, switchMap, takeUntil, Subject } from 'rxjs';
import { NotificationApiService } from './notification-api.service';
import {
  Device,
  Notification,
  NotificationPreferences,
  NotificationType,
  NotificationCategory,
  RegisterDeviceRequest,
  UpdatePreferencesRequest,
  NOTIFICATION_CATEGORY_MAP,
} from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationStateService {
  private readonly api = inject(NotificationApiService);

  // Polling configuration
  private readonly POLL_INTERVAL_MS = 30000; // 30 seconds
  private readonly destroy$ = new Subject<void>();
  private pollingActive = false;

  // ==================== State Signals ====================

  private readonly _notifications = signal<Notification[]>([]);
  private readonly _devices = signal<Device[]>([]);
  private readonly _preferences = signal<NotificationPreferences | null>(null);
  private readonly _unreadCount = signal<number>(0);
  private readonly _isLoading = signal(false);
  private readonly _isLoadingMore = signal(false);
  private readonly _isProcessing = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);
  private readonly _currentPage = signal(0);
  private readonly _totalPages = signal(0);
  private readonly _totalElements = signal(0);
  private readonly _selectedCategory = signal<NotificationCategory | null>(null);
  private readonly _showUnreadOnly = signal(false);

  // ==================== Public Readonly Signals ====================

  readonly notifications = this._notifications.asReadonly();
  readonly devices = this._devices.asReadonly();
  readonly preferences = this._preferences.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isLoadingMore = this._isLoadingMore.asReadonly();
  readonly isProcessing = this._isProcessing.asReadonly();
  readonly error = this._error.asReadonly();
  readonly successMessage = this._successMessage.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly selectedCategory = this._selectedCategory.asReadonly();
  readonly showUnreadOnly = this._showUnreadOnly.asReadonly();

  // ==================== Computed Properties ====================

  readonly hasUnread = computed(() => this._unreadCount() > 0);

  readonly hasMorePages = computed(() => {
    return this._currentPage() < this._totalPages() - 1;
  });

  readonly isEmpty = computed(() => {
    return !this._isLoading() && this._notifications().length === 0;
  });

  readonly filteredNotifications = computed(() => {
    const notifications = this._notifications();
    const category = this._selectedCategory();
    const unreadOnly = this._showUnreadOnly();

    let filtered = notifications;

    if (category) {
      filtered = filtered.filter(n => NOTIFICATION_CATEGORY_MAP[n.type] === category);
    }

    if (unreadOnly) {
      filtered = filtered.filter(n => !n.isRead);
    }

    return filtered;
  });

  readonly unreadNotifications = computed(() => {
    return this._notifications().filter(n => !n.isRead);
  });

  readonly notificationsByCategory = computed(() => {
    const notifications = this._notifications();
    const grouped: Record<NotificationCategory, Notification[]> = {
      document: [],
      ocr: [],
      storage: [],
      payment: [],
      subscription: [],
      team: [],
      system: [],
    };

    notifications.forEach(n => {
      const category = NOTIFICATION_CATEGORY_MAP[n.type];
      if (category) {
        grouped[category].push(n);
      }
    });

    return grouped;
  });

  readonly isPushEnabled = computed(() => {
    return this._preferences()?.pushEnabled ?? false;
  });

  readonly isEmailEnabled = computed(() => {
    return this._preferences()?.emailEnabled ?? false;
  });

  readonly activeDevicesCount = computed(() => {
    return this._devices().filter(d => d.isActive).length;
  });

  // ==================== Notification Actions ====================

  /**
   * Load notifications with optional reset
   */
  loadNotifications(reset = true, page = 0, size = 20): void {
    if (reset) {
      this._isLoading.set(true);
      this._currentPage.set(0);
    } else {
      this._isLoadingMore.set(true);
    }
    this._error.set(null);

    const loadPage = reset ? 0 : page;

    this.api.getNotifications(loadPage, size).pipe(
      tap(response => {
        if (reset) {
          this._notifications.set(response.content);
        } else {
          this._notifications.update(current => [...current, ...response.content]);
        }
        this._currentPage.set(response.pageable.pageNumber);
        this._totalPages.set(response.totalPages);
        this._totalElements.set(response.totalElements);
      }),
      catchError(error => {
        this._error.set(error?.error?.message || 'Failed to load notifications');
        return of(null);
      }),
      finalize(() => {
        this._isLoading.set(false);
        this._isLoadingMore.set(false);
      })
    ).subscribe();
  }

  /**
   * Load more notifications (pagination)
   */
  loadMoreNotifications(size = 20): void {
    if (this._isLoadingMore() || !this.hasMorePages()) {
      return;
    }
    this.loadNotifications(false, this._currentPage() + 1, size);
  }

  /**
   * Load unread notifications
   */
  loadUnreadNotifications(page = 0, size = 20): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._showUnreadOnly.set(true);

    this.api.getUnreadNotifications(page, size).pipe(
      tap(response => {
        this._notifications.set(response.content);
        this._currentPage.set(response.pageable.pageNumber);
        this._totalPages.set(response.totalPages);
        this._totalElements.set(response.totalElements);
      }),
      catchError(error => {
        this._error.set(error?.error?.message || 'Failed to load unread notifications');
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Load notifications by type
   */
  loadNotificationsByType(type: NotificationType, page = 0, size = 20): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.getNotificationsByType(type, page, size).pipe(
      tap(response => {
        this._notifications.set(response.content);
        this._currentPage.set(response.pageable.pageNumber);
        this._totalPages.set(response.totalPages);
        this._totalElements.set(response.totalElements);
      }),
      catchError(error => {
        this._error.set(error?.error?.message || 'Failed to load notifications');
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Refresh unread count
   */
  refreshUnreadCount(): void {
    this.api.getUnreadCount().pipe(
      tap(response => {
        this._unreadCount.set(response.count);
      }),
      catchError(error => {
        console.error('Failed to fetch unread count:', error);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: string): void {
    this._isProcessing.set(true);

    this.api.markAsRead(notificationId).pipe(
      tap(() => {
        // Update local state
        this._notifications.update(notifications =>
          notifications.map(n =>
            n.id === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        );
        // Decrement unread count
        this._unreadCount.update(count => Math.max(0, count - 1));
      }),
      catchError(error => {
        this._error.set(error?.error?.message || 'Failed to mark notification as read');
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this._isProcessing.set(true);

    this.api.markAllAsRead().pipe(
      tap(() => {
        // Update local state
        this._notifications.update(notifications =>
          notifications.map(n => ({
            ...n,
            isRead: true,
            readAt: n.readAt || new Date().toISOString()
          }))
        );
        this._unreadCount.set(0);
        this._successMessage.set('All notifications marked as read');
        this.clearSuccessMessageAfterDelay();
      }),
      catchError(error => {
        this._error.set(error?.error?.message || 'Failed to mark all as read');
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Delete a notification
   */
  deleteNotification(notificationId: string): void {
    this._isProcessing.set(true);

    this.api.deleteNotification(notificationId).pipe(
      tap(() => {
        const notification = this._notifications().find(n => n.id === notificationId);
        // Remove from local state
        this._notifications.update(notifications =>
          notifications.filter(n => n.id !== notificationId)
        );
        this._totalElements.update(total => Math.max(0, total - 1));
        // Update unread count if the deleted notification was unread
        if (notification && !notification.isRead) {
          this._unreadCount.update(count => Math.max(0, count - 1));
        }
        this._successMessage.set('Notification deleted');
        this.clearSuccessMessageAfterDelay();
      }),
      catchError(error => {
        this._error.set(error?.error?.message || 'Failed to delete notification');
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  // ==================== Device Actions ====================

  /**
   * Load registered devices
   */
  loadDevices(): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.getDevices().pipe(
      tap(devices => {
        this._devices.set(devices);
      }),
      catchError(error => {
        this._error.set(error?.error?.message || 'Failed to load devices');
        return of([]);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Register a new device for push notifications
   */
  registerDevice(request: RegisterDeviceRequest): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.api.registerDevice(request).pipe(
      tap(device => {
        this._devices.update(devices => [...devices, device]);
        this._successMessage.set('Device registered successfully');
        this.clearSuccessMessageAfterDelay();
      }),
      catchError(error => {
        const message = error?.error?.message || 'Failed to register device';
        this._error.set(message);
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Unregister a device
   */
  unregisterDevice(tokenId: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.api.unregisterDevice(tokenId).pipe(
      tap(() => {
        this._devices.update(devices => devices.filter(d => d.id !== tokenId));
        this._successMessage.set('Device unregistered successfully');
        this.clearSuccessMessageAfterDelay();
      }),
      catchError(error => {
        this._error.set(error?.error?.message || 'Failed to unregister device');
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  // ==================== Preferences Actions ====================

  /**
   * Load notification preferences
   */
  loadPreferences(): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.getPreferences().pipe(
      tap(preferences => {
        this._preferences.set(preferences);
      }),
      catchError(error => {
        this._error.set(error?.error?.message || 'Failed to load preferences');
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Update notification preferences
   */
  updatePreferences(preferences: UpdatePreferencesRequest): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.api.updatePreferences(preferences).pipe(
      tap(updatedPreferences => {
        this._preferences.set(updatedPreferences);
        this._successMessage.set('Preferences updated successfully');
        this.clearSuccessMessageAfterDelay();
      }),
      catchError(error => {
        this._error.set(error?.error?.message || 'Failed to update preferences');
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  // ==================== Filter Actions ====================

  /**
   * Set category filter
   */
  setCategory(category: NotificationCategory | null): void {
    this._selectedCategory.set(category);
  }

  /**
   * Toggle unread only filter
   */
  toggleUnreadOnly(): void {
    this._showUnreadOnly.update(current => !current);
  }

  /**
   * Set unread only filter
   */
  setUnreadOnly(value: boolean): void {
    this._showUnreadOnly.set(value);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this._selectedCategory.set(null);
    this._showUnreadOnly.set(false);
  }

  // ==================== Polling ====================

  /**
   * Start polling for new notifications
   */
  startPolling(): void {
    if (this.pollingActive) {
      return;
    }

    this.pollingActive = true;

    interval(this.POLL_INTERVAL_MS).pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.api.getUnreadCount())
    ).subscribe({
      next: response => {
        const previousCount = this._unreadCount();
        this._unreadCount.set(response.count);

        // If there are new notifications, refresh the list
        if (response.count > previousCount) {
          this.loadNotifications(true);
        }
      },
      error: error => {
        console.error('Polling error:', error);
      }
    });
  }

  /**
   * Stop polling for notifications
   */
  stopPolling(): void {
    this.pollingActive = false;
    this.destroy$.next();
  }

  // ==================== Utility Methods ====================

  /**
   * Initialize the notification service - load all required data
   */
  initialize(): void {
    this.loadNotifications(true);
    this.refreshUnreadCount();
    this.loadPreferences();
    this.loadDevices();
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Clear success message
   */
  clearSuccessMessage(): void {
    this._successMessage.set(null);
  }

  /**
   * Clear success message after delay
   */
  private clearSuccessMessageAfterDelay(delayMs = 3000): void {
    setTimeout(() => {
      this._successMessage.set(null);
    }, delayMs);
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.stopPolling();
    this._notifications.set([]);
    this._devices.set([]);
    this._preferences.set(null);
    this._unreadCount.set(0);
    this._isLoading.set(false);
    this._isLoadingMore.set(false);
    this._isProcessing.set(false);
    this._error.set(null);
    this._successMessage.set(null);
    this._currentPage.set(0);
    this._totalPages.set(0);
    this._totalElements.set(0);
    this._selectedCategory.set(null);
    this._showUnreadOnly.set(false);
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.stopPolling();
    this.destroy$.complete();
  }
}

