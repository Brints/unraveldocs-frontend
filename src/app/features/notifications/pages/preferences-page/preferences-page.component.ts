import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationStateService } from '../../services/notification-state.service';
import { PushNotificationService } from '../../services/push-notification.service';
import {
  NotificationPreferences,
  UpdatePreferencesRequest,
} from '../../models/notification.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-preferences-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './preferences-page.component.html',
  styleUrl: './preferences-page.component.css'
})
export class PreferencesPageComponent implements OnInit {
  readonly notificationState = inject(NotificationStateService);
  readonly pushService = inject(PushNotificationService);

  isSendingTest = false;

  get preferences(): NotificationPreferences | null {
    return this.notificationState.preferences();
  }

  ngOnInit(): void {
    this.notificationState.loadPreferences();
    this.notificationState.loadDevices();
    this.pushService.checkSubscriptionStatus();
  }

  async sendTestNotification(): Promise<void> {
    this.isSendingTest = true;
    try {
      // Use the browser's Notification API to show a local test notification
      const success = await this.pushService.showLocalNotification(
        'Test Notification',
        {
          body: 'This is a test notification from UnravelDocs. Push notifications are working correctly!',
          icon: '/assets/logo.svg',
          tag: 'test-notification',
          data: { type: 'TEST' }
        }
      );

      if (!success) {
        // Fallback: show notification directly if service worker method fails
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Test Notification', {
            body: 'This is a test notification from UnravelDocs. Push notifications are working correctly!',
            icon: '/assets/logo.svg',
            tag: 'test-notification'
          });
        }
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
    } finally {
      this.isSendingTest = false;
    }
  }

  updatePreference(key: keyof UpdatePreferencesRequest, value: boolean): void {
    const current = this.preferences;
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
      quietHoursEnd: current.quietHoursEnd || undefined,
      [key]: value
    };

    this.notificationState.updatePreferences(update);
  }

  updateQuietHoursStart(time: string): void {
    const current = this.preferences;
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

  updateQuietHoursEnd(time: string): void {
    const current = this.preferences;
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

  formatTimeForInput(time: string | null | undefined): string {
    if (!time) return '';
    // Convert HH:mm:ss to HH:mm for input
    return time.substring(0, 5);
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

  async enablePushNotifications(): Promise<void> {
    const vapidKey = (environment as any).firebase?.vapidKey || '';
    if (!vapidKey || vapidKey === 'YOUR_VAPID_PUBLIC_KEY') {
      console.warn('VAPID key not configured in environment. Please set firebase.vapidKey in environment.ts');
    }

    const success = await this.pushService.subscribe(vapidKey);
    if (success) {
      // Refresh devices list after successful subscription
      this.notificationState.loadDevices();
    }
  }

  async disablePushNotifications(): Promise<void> {
    const success = await this.pushService.unsubscribe();
    if (success) {
      // Refresh devices list after successful unsubscription
      this.notificationState.loadDevices();
    }
  }

  removeDevice(deviceId: string): void {
    this.notificationState.unregisterDevice(deviceId);
  }
}

