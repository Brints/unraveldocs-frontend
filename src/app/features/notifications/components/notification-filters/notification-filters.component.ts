import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationCategory } from '../../models/notification.model';

interface CategoryOption {
  value: NotificationCategory | null;
  label: string;
}

@Component({
  selector: 'app-notification-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-filters.component.html',
  styleUrl: './notification-filters.component.css'
})
export class NotificationFiltersComponent {
  @Input() selectedCategory: NotificationCategory | null = null;
  @Input() showUnreadOnly = false;
  @Input() unreadCount = 0;

  @Output() categoryChange = new EventEmitter<NotificationCategory | null>();
  @Output() unreadOnlyChange = new EventEmitter<boolean>();

  categories: CategoryOption[] = [
    { value: null, label: 'All' },
    { value: 'document', label: 'Documents' },
    { value: 'ocr', label: 'OCR' },
    { value: 'payment', label: 'Payments' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'team', label: 'Team' },
    { value: 'system', label: 'System' },
  ];

  selectCategory(category: NotificationCategory | null): void {
    this.categoryChange.emit(category);
  }

  toggleUnreadOnly(): void {
    this.unreadOnlyChange.emit(!this.showUnreadOnly);
  }
}

