import { Component, inject, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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

  private pushSubscription?: Subscription;

  isOpen = false;

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
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.isOpen = false;
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.notificationState.loadNotifications(true, 0, 5);
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  markAllAsRead(): void {
    this.notificationState.markAllAsRead();
  }

  onNotificationClick(notification: AppNotification): void {
    if (!notification.isRead) {
      this.notificationState.markAsRead(notification.id);
    }
    this.closeDropdown();
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

