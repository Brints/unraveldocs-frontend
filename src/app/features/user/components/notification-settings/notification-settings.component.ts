import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PushNotificationService } from '../../../notifications/services/push-notification.service';
import { NotificationStateService } from '../../../notifications/services/notification-state.service';
import {
  NotificationPreferences,
  UpdatePreferencesRequest
} from '../../../notifications/models/notification.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.css']
})
export class NotificationSettingsComponent implements OnInit {
  readonly pushService = inject(PushNotificationService);
  readonly notificationState = inject(NotificationStateService);

  // Local state for optimistic updates
  private localPreferences = signal<NotificationPreferences | null>(null);

  // Computed preferences that prioritize local state for immediate feedback
  readonly preferences = computed(() => {
    return this.localPreferences() ?? this.notificationState.preferences();
  });

  readonly isLoading = computed(() => this.notificationState.isLoading());
  readonly isSaving = computed(() => this.notificationState.isProcessing());
  readonly saveSuccess = this.notificationState.successMessage;
  readonly saveError = this.notificationState.error;

  // Notification categories mapped to API fields
  readonly notificationCategories = [
    {
      key: 'documentNotifications',
      label: 'Document Notifications',
      description: 'Upload success, failures, and deletions'
    },
    {
      key: 'ocrNotifications',
      label: 'OCR Processing',
      description: 'Text extraction and processing updates'
    },
    {
      key: 'paymentNotifications',
      label: 'Payment Notifications',
      description: 'Payment confirmations, failures, and refunds'
    },
    {
      key: 'storageNotifications',
      label: 'Storage Alerts',
      description: 'Storage usage warnings and limits'
    },
    {
      key: 'subscriptionNotifications',
      label: 'Subscription Notifications',
      description: 'Subscription expiry, renewal, and changes'
    },
    {
      key: 'teamNotifications',
      label: 'Team Notifications',
      description: 'Team invitations and member changes'
    }
  ];

  ngOnInit(): void {
    this.notificationState.loadPreferences();
    this.notificationState.loadDevices();
    this.pushService.checkSubscriptionStatus();
  }

  // Get value for a specific preference
  getPreferenceValue(key: string): boolean {
    const prefs = this.preferences();
    if (!prefs) return false;
    return (prefs as any)[key] ?? false;
  }

  // Toggle a specific notification preference
  togglePreference(key: string): void {
    const current = this.preferences();
    if (!current) return;

    const newValue = !this.getPreferenceValue(key);

    // Optimistic update
    const optimisticUpdate: NotificationPreferences = {
      ...current,
      [key]: newValue,
      updatedAt: new Date().toISOString()
    };
    this.localPreferences.set(optimisticUpdate);

    // Build the update request
    const update: UpdatePreferencesRequest = {
      pushEnabled: key === 'pushEnabled' ? newValue : current.pushEnabled,
      emailEnabled: key === 'emailEnabled' ? newValue : current.emailEnabled,
      documentNotifications: key === 'documentNotifications' ? newValue : current.documentNotifications,
      ocrNotifications: key === 'ocrNotifications' ? newValue : current.ocrNotifications,
      paymentNotifications: key === 'paymentNotifications' ? newValue : current.paymentNotifications,
      storageNotifications: key === 'storageNotifications' ? newValue : current.storageNotifications,
      subscriptionNotifications: key === 'subscriptionNotifications' ? newValue : current.subscriptionNotifications,
      teamNotifications: key === 'teamNotifications' ? newValue : current.teamNotifications,
      quietHoursEnabled: current.quietHoursEnabled,
      quietHoursStart: current.quietHoursStart || undefined,
      quietHoursEnd: current.quietHoursEnd || undefined,
    };

    this.notificationState.updatePreferences(update);

    // Clear local state after API call
    setTimeout(() => {
      this.localPreferences.set(null);
    }, 500);
  }

  // Toggle quiet hours
  toggleQuietHours(): void {
    const current = this.preferences();
    if (!current) return;

    const newValue = !current.quietHoursEnabled;

    const update: UpdatePreferencesRequest = {
      pushEnabled: current.pushEnabled,
      emailEnabled: current.emailEnabled,
      documentNotifications: current.documentNotifications,
      ocrNotifications: current.ocrNotifications,
      paymentNotifications: current.paymentNotifications,
      storageNotifications: current.storageNotifications,
      subscriptionNotifications: current.subscriptionNotifications,
      teamNotifications: current.teamNotifications,
      quietHoursEnabled: newValue,
      quietHoursStart: current.quietHoursStart || '22:00:00',
      quietHoursEnd: current.quietHoursEnd || '07:00:00',
    };

    this.notificationState.updatePreferences(update);
  }

  // Update quiet hours start time
  updateQuietHoursStart(event: Event): void {
    const input = event.target as HTMLInputElement;
    const time = input.value;
    const current = this.preferences();
    if (!current) return;

    const update: UpdatePreferencesRequest = {
      pushEnabled: current.pushEnabled,
      emailEnabled: current.emailEnabled,
      documentNotifications: current.documentNotifications,
      ocrNotifications: current.ocrNotifications,
      paymentNotifications: current.paymentNotifications,
      storageNotifications: current.storageNotifications,
      subscriptionNotifications: current.subscriptionNotifications,
      teamNotifications: current.teamNotifications,
      quietHoursEnabled: current.quietHoursEnabled,
      quietHoursStart: time ? `${time}:00` : undefined,
      quietHoursEnd: current.quietHoursEnd || undefined,
    };

    this.notificationState.updatePreferences(update);
  }

  // Update quiet hours end time
  updateQuietHoursEnd(event: Event): void {
    const input = event.target as HTMLInputElement;
    const time = input.value;
    const current = this.preferences();
    if (!current) return;

    const update: UpdatePreferencesRequest = {
      pushEnabled: current.pushEnabled,
      emailEnabled: current.emailEnabled,
      documentNotifications: current.documentNotifications,
      ocrNotifications: current.ocrNotifications,
      paymentNotifications: current.paymentNotifications,
      storageNotifications: current.storageNotifications,
      subscriptionNotifications: current.subscriptionNotifications,
      teamNotifications: current.teamNotifications,
      quietHoursEnabled: current.quietHoursEnabled,
      quietHoursStart: current.quietHoursStart || undefined,
      quietHoursEnd: time ? `${time}:00` : undefined,
    };

    this.notificationState.updatePreferences(update);
  }

  // Format time for input
  formatTimeForInput(time: string | null | undefined): string {
    if (!time) return '';
    return time.substring(0, 5);
  }

  // Enable all notifications
  enableAllNotifications(): void {
    const current = this.preferences();
    if (!current) return;

    const update: UpdatePreferencesRequest = {
      pushEnabled: true,
      emailEnabled: true,
      documentNotifications: true,
      ocrNotifications: true,
      paymentNotifications: true,
      storageNotifications: true,
      subscriptionNotifications: true,
      teamNotifications: true,
      quietHoursEnabled: current.quietHoursEnabled,
      quietHoursStart: current.quietHoursStart || undefined,
      quietHoursEnd: current.quietHoursEnd || undefined,
    };

    this.notificationState.updatePreferences(update);
  }

  // Disable all notifications (except security-critical ones)
  disableAllNotifications(): void {
    const current = this.preferences();
    if (!current) return;

    const update: UpdatePreferencesRequest = {
      pushEnabled: false,
      emailEnabled: false,
      documentNotifications: false,
      ocrNotifications: false,
      paymentNotifications: true, // Keep payment notifications
      storageNotifications: true, // Keep storage notifications
      subscriptionNotifications: true, // Keep subscription notifications
      teamNotifications: false,
      quietHoursEnabled: current.quietHoursEnabled,
      quietHoursStart: current.quietHoursStart || undefined,
      quietHoursEnd: current.quietHoursEnd || undefined,
    };

    this.notificationState.updatePreferences(update);
  }

  // Push notification methods
  async enableBrowserPush(): Promise<void> {
    const vapidKey = (environment as any).firebase?.vapidKey || '';
    await this.pushService.subscribe(vapidKey);
    this.notificationState.loadDevices();
  }

  async disableBrowserPush(): Promise<void> {
    await this.pushService.unsubscribe();
    this.notificationState.loadDevices();
  }

  // Device management
  removeDevice(deviceId: string): void {
    this.notificationState.unregisterDevice(deviceId);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'today';
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

