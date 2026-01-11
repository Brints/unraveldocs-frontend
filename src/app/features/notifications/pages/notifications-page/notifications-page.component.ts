import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationStateService } from '../../services/notification-state.service';
import { NotificationListComponent } from '../../components/notification-list/notification-list.component';
import { NotificationFiltersComponent } from '../../components/notification-filters/notification-filters.component';
import { NotificationCategory } from '../../models/notification.model';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NotificationListComponent,
    NotificationFiltersComponent,
  ],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.css'
})
export class NotificationsPageComponent implements OnInit, OnDestroy {
  readonly notificationState = inject(NotificationStateService);

  ngOnInit(): void {
    this.notificationState.loadNotifications(true);
    this.notificationState.refreshUnreadCount();
    this.notificationState.startPolling();
  }

  ngOnDestroy(): void {
    this.notificationState.stopPolling();
  }

  markAllAsRead(): void {
    this.notificationState.markAllAsRead();
  }

  onCategoryChange(category: NotificationCategory | null): void {
    this.notificationState.setCategory(category);
  }

  onUnreadOnlyChange(value: boolean): void {
    this.notificationState.setUnreadOnly(value);
  }

  onMarkAsRead(notificationId: string): void {
    this.notificationState.markAsRead(notificationId);
  }

  onDelete(notificationId: string): void {
    this.notificationState.deleteNotification(notificationId);
  }

  onLoadMore(): void {
    this.notificationState.loadMoreNotifications();
  }
}

