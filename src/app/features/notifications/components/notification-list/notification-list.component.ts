import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification as AppNotification, NotificationCategory, NOTIFICATION_CATEGORY_MAP } from '../../models/notification.model';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.css'
})
export class NotificationListComponent {
  @Input() notifications: AppNotification[] = [];
  @Input() isLoading = false;
  @Input() hasMore = false;
  @Input() isLoadingMore = false;

  @Output() markAsRead = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() loadMore = new EventEmitter<void>();

  // For skeleton loading
  skeletonItems = [1, 2, 3, 4, 5];

  getCategory(notification: AppNotification): NotificationCategory {
    return NOTIFICATION_CATEGORY_MAP[notification.type] || 'system';
  }

  getCategoryClass(notification: AppNotification): string {
    return this.getCategory(notification);
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

  onNotificationClick(notification: AppNotification): void {
    if (!notification.isRead) {
      this.markAsRead.emit(notification.id);
    }
  }

  onMarkAsRead(event: Event, notificationId: string): void {
    event.stopPropagation();
    this.markAsRead.emit(notificationId);
  }

  onDelete(event: Event, notificationId: string): void {
    event.stopPropagation();
    this.delete.emit(notificationId);
  }

  onLoadMore(): void {
    this.loadMore.emit();
  }
}

