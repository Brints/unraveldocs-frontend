import { Component, inject, OnInit, OnDestroy, HostListener, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationStateService } from '../../services/notification-state.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { Notification as AppNotification, NOTIFICATION_CATEGORY_MAP, NotificationCategory } from '../../models/notification.model';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css'
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  readonly notificationState = inject(NotificationStateService);
  private readonly pushService = inject(PushNotificationService);
  private readonly elementRef = inject(ElementRef);
  private readonly router = inject(Router);

  private pushSubscription?: Subscription;

  isOpen = false;
  expandedNotificationId = signal<string | null>(null);

  get recentNotifications(): AppNotification[] {
    return this.notificationState.notifications().slice(0, 5);
  }

  ngOnInit(): void {
    this.notificationState.refreshUnreadCount();
    this.notificationState.loadNotifications(true, 0, 5);
    this.notificationState.startPolling();

    // Listen for incoming push notifications
    this.pushSubscription = this.pushService.notificationReceived$.subscribe(() => {
      // Refresh notifications when a new push notification is received
      this.notificationState.refreshUnreadCount();
      this.notificationState.loadNotifications(true, 0, 5);
    });
  }

  ngOnDestroy(): void {
    this.notificationState.stopPolling();
    this.pushSubscription?.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.expandedNotificationId.set(null);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.isOpen = false;
    this.expandedNotificationId.set(null);
  }

  toggleDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.expandedNotificationId.set(null);
      this.notificationState.loadNotifications(true, 0, 5);
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.expandedNotificationId.set(null);
  }

  markAllAsRead(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.notificationState.markAllAsRead();
  }

  onNotificationClick(notification: AppNotification, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    // Mark as read if unread
    if (!notification.isRead) {
      this.notificationState.markAsRead(notification.id);
    }

    // Toggle expanded state - if already expanded, collapse; otherwise expand
    if (this.expandedNotificationId() === notification.id) {
      this.expandedNotificationId.set(null);
    } else {
      this.expandedNotificationId.set(notification.id);
    }
  }

  navigateToNotification(notification: AppNotification, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    // Navigate based on notification type/category
    const route = this.getNotificationRoute(notification);
    this.closeDropdown();
    if (route) {
      this.router.navigate(route.path, route.extras);
    }
  }

  viewAllNotifications(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.closeDropdown();
    this.router.navigate(['/notifications']);
  }

  isExpanded(notificationId: string): boolean {
    return this.expandedNotificationId() === notificationId;
  }

  private getNotificationRoute(notification: AppNotification): { path: string[], extras?: any } | null {
    const data = notification.data || {};

    switch (notification.type) {
      case 'DOCUMENT_UPLOAD_SUCCESS':
      case 'DOCUMENT_UPLOAD_FAILED':
      case 'DOCUMENT_DELETED':
        if (data['documentId']) {
          return { path: ['/documents'] };
        }
        return { path: ['/documents'] };

      case 'OCR_PROCESSING_STARTED':
      case 'OCR_PROCESSING_COMPLETED':
      case 'OCR_PROCESSING_FAILED':
        if (data['documentId']) {
          return { path: ['/documents'] };
        }
        return { path: ['/documents'] };

      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
      case 'PAYMENT_REFUNDED':
        return { path: ['/payments'] };

      case 'SUBSCRIPTION_EXPIRING_7_DAYS':
      case 'SUBSCRIPTION_EXPIRING_3_DAYS':
      case 'SUBSCRIPTION_EXPIRING_1_DAY':
      case 'SUBSCRIPTION_EXPIRED':
      case 'SUBSCRIPTION_RENEWED':
      case 'SUBSCRIPTION_UPGRADED':
      case 'SUBSCRIPTION_DOWNGRADED':
      case 'TRIAL_EXPIRING_SOON':
      case 'TRIAL_EXPIRED':
        return { path: ['/subscription'] };

      case 'STORAGE_WARNING_80':
      case 'STORAGE_WARNING_90':
      case 'STORAGE_WARNING_95':
      case 'STORAGE_LIMIT_REACHED':
        return { path: ['/subscription'] };

      case 'TEAM_INVITATION_RECEIVED':
      case 'TEAM_MEMBER_ADDED':
      case 'TEAM_MEMBER_REMOVED':
      case 'TEAM_ROLE_CHANGED':
        return { path: ['/teams'] };

      default:
        return { path: ['/notifications'] };
    }
  }

  getCategory(notification: AppNotification): NotificationCategory {
    return NOTIFICATION_CATEGORY_MAP[notification.type] || 'system';
  }

  truncateMessage(message: string, maxLength = 60): string {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

