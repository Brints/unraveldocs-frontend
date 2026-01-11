import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserApiService } from '../../services/user-api.service';
import { NotificationPreferences } from '../../models/user.model';
import { PushNotificationService } from '../../../notifications/services/push-notification.service';
import { NotificationStateService } from '../../../notifications/services/notification-state.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.css']
})
export class NotificationSettingsComponent implements OnInit {
  private readonly userApi = inject(UserApiService);
  readonly pushService = inject(PushNotificationService);
  readonly notificationState = inject(NotificationStateService);

  // State
  isLoading = signal(true);
  isSaving = signal(false);
  saveSuccess = signal(false);
  saveError = signal<string | null>(null);

  // Notification preferences
  preferences = signal<NotificationPreferences>({
    email: {
      documentShared: true,
      ocrCompleted: true,
      teamInvitations: true,
      paymentReminders: true,
      securityAlerts: true,
      weeklyDigest: false,
      marketingUpdates: false
    },
    push: {
      documentShared: true,
      ocrCompleted: true,
      teamInvitations: true,
      paymentReminders: false,
      securityAlerts: true
    },
    sms: {
      securityAlerts: false,
      paymentReminders: false
    }
  });

  // Notification categories for display
  readonly emailNotifications = [
    {
      key: 'documentShared',
      label: 'Document Shared',
      description: 'When someone shares a document with you'
    },
    {
      key: 'ocrCompleted',
      label: 'OCR Processing Complete',
      description: 'When your document has finished processing'
    },
    {
      key: 'teamInvitations',
      label: 'Team Invitations',
      description: 'When you receive a team invitation'
    },
    {
      key: 'paymentReminders',
      label: 'Payment Reminders',
      description: 'Upcoming payment and billing reminders'
    },
    {
      key: 'securityAlerts',
      label: 'Security Alerts',
      description: 'Important security notifications'
    },
    {
      key: 'weeklyDigest',
      label: 'Weekly Digest',
      description: 'Weekly summary of your activity'
    },
    {
      key: 'marketingUpdates',
      label: 'Product Updates',
      description: 'New features and product announcements'
    }
  ];

  readonly pushNotifications = [
    {
      key: 'documentShared',
      label: 'Document Shared',
      description: 'Real-time notifications when documents are shared'
    },
    {
      key: 'ocrCompleted',
      label: 'OCR Complete',
      description: 'Instant notification when processing finishes'
    },
    {
      key: 'teamInvitations',
      label: 'Team Invitations',
      description: 'Immediate notification for team invites'
    },
    {
      key: 'paymentReminders',
      label: 'Payment Reminders',
      description: 'Push reminders for upcoming payments'
    },
    {
      key: 'securityAlerts',
      label: 'Security Alerts',
      description: 'Critical security notifications'
    }
  ];

  readonly smsNotifications = [
    {
      key: 'securityAlerts',
      label: 'Security Alerts',
      description: 'SMS for critical security events'
    },
    {
      key: 'paymentReminders',
      label: 'Payment Reminders',
      description: 'SMS reminders for important payments'
    }
  ];

  ngOnInit(): void {
    this.loadPreferences();
    this.pushService.checkSubscriptionStatus();
  }

  private loadPreferences(): void {
    this.isLoading.set(true);

    // Simulate API call - replace with actual API
    setTimeout(() => {
      this.isLoading.set(false);
    }, 800);
  }

  async enableBrowserPush(): Promise<void> {
    const vapidKey = (environment as any).firebase?.vapidKey || '';
    await this.pushService.subscribe(vapidKey);
  }

  async disableBrowserPush(): Promise<void> {
    await this.pushService.unsubscribe();
  }

  toggleEmailNotification(key: string): void {
    this.preferences.update(prefs => ({
      ...prefs,
      email: {
        ...prefs.email,
        [key]: !prefs.email[key as keyof typeof prefs.email]
      }
    }));
    this.savePreferences();
  }

  togglePushNotification(key: string): void {
    this.preferences.update(prefs => ({
      ...prefs,
      push: {
        ...prefs.push,
        [key]: !prefs.push[key as keyof typeof prefs.push]
      }
    }));
    this.savePreferences();
  }

  toggleSmsNotification(key: string): void {
    this.preferences.update(prefs => ({
      ...prefs,
      sms: {
        ...prefs.sms,
        [key]: !prefs.sms[key as keyof typeof prefs.sms]
      }
    }));
    this.savePreferences();
  }

  getEmailValue(key: string): boolean {
    const email = this.preferences().email;
    return (email as Record<string, boolean>)[key] ?? false;
  }

  getPushValue(key: string): boolean {
    const push = this.preferences().push;
    return (push as Record<string, boolean>)[key] ?? false;
  }

  getSmsValue(key: string): boolean {
    const sms = this.preferences().sms;
    return (sms as Record<string, boolean>)[key] ?? false;
  }

  private savePreferences(): void {
    this.isSaving.set(true);
    this.saveSuccess.set(false);
    this.saveError.set(null);

    // Debounced save - simulate API call
    setTimeout(() => {
      this.isSaving.set(false);
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 2000);
    }, 500);
  }

  enableAllEmail(): void {
    this.preferences.update(prefs => ({
      ...prefs,
      email: {
        documentShared: true,
        ocrCompleted: true,
        teamInvitations: true,
        paymentReminders: true,
        securityAlerts: true,
        weeklyDigest: true,
        marketingUpdates: true
      }
    }));
    this.savePreferences();
  }

  disableAllEmail(): void {
    this.preferences.update(prefs => ({
      ...prefs,
      email: {
        documentShared: false,
        ocrCompleted: false,
        teamInvitations: false,
        paymentReminders: false,
        securityAlerts: true, // Keep security alerts on
        weeklyDigest: false,
        marketingUpdates: false
      }
    }));
    this.savePreferences();
  }

  enableAllPush(): void {
    this.preferences.update(prefs => ({
      ...prefs,
      push: {
        documentShared: true,
        ocrCompleted: true,
        teamInvitations: true,
        paymentReminders: true,
        securityAlerts: true
      }
    }));
    this.savePreferences();
  }

  disableAllPush(): void {
    this.preferences.update(prefs => ({
      ...prefs,
      push: {
        documentShared: false,
        ocrCompleted: false,
        teamInvitations: false,
        paymentReminders: false,
        securityAlerts: true // Keep security alerts on
      }
    }));
    this.savePreferences();
  }
}

