import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface ActivityItem {
  id: string;
  type: 'document_created' | 'document_edited' | 'collaboration_invited' | 'file_uploaded' | 'comment_added' | 'share_created';
  title: string;
  description: string;
  timestamp: Date;
  icon?: string;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
}

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-section recent-activity-section">
      <div class="section-header">
        <h2 class="section-title">Recent Activity</h2>
        <p class="section-description">Your latest document activities</p>
      </div>

      <div class="activity-list">
        @if (loading()) {
          @for (i of [1,2,3,4]; track i) {
            <div class="activity-item skeleton">
              <div class="skeleton-activity-icon"></div>
              <div class="skeleton-activity-content">
                <div class="skeleton-activity-title"></div>
                <div class="skeleton-activity-description"></div>
              </div>
              <div class="skeleton-activity-time"></div>
            </div>
          }
        } @else {
          @for (activity of activities(); track activity.id) {
            <div class="activity-item" (click)="onActivityClick(activity)">
              <div class="activity-icon" [class]="getActivityIconClass(activity.type)">
                @if (activity.user?.avatar) {
                  <img [src]="activity.user.avatar" [alt]="activity.user.name" class="user-avatar">
                } @else {
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path [attr.d]="getActivityIcon(activity.type)"/>
                  </svg>
                }
              </div>
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-description">
                  {{ activity.description }}
                  @if (activity.user) {
                    <span class="activity-user">by {{ activity.user.name }}</span>
                  }
                </div>
                @if (activity.metadata?.tags) {
                  <div class="activity-tags">
                    @for (tag of activity.metadata.tags; track tag) {
                      <span class="activity-tag">{{ tag }}</span>
                    }
                  </div>
                }
              </div>
              <div class="activity-time-container">
                <div class="activity-time">{{ formatTimeAgo(activity.timestamp) }}</div>
                @if (activity.metadata?.priority) {
                  <div class="activity-priority" [class]="'priority-' + activity.metadata.priority">
                    {{ activity.metadata.priority }}
                  </div>
                }
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="empty-message">No recent activity</p>
              <p class="empty-description">Start by creating a new document</p>
            </div>
          }
        }
      </div>

      @if (activities().length > 0 && !loading()) {
        <div class="activity-footer">
          <a routerLink="/activity" class="view-all-link">
            View all activity
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .activity-item {
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .activity-item:hover {
      background: rgba(102, 126, 234, 0.05);
      transform: translateX(4px);
    }

    .user-avatar {
      width: 100%;
      height: 100%;
      border-radius: 6px;
      object-fit: cover;
    }

    .activity-user {
      color: #667eea;
      font-weight: 500;
    }

    .activity-tags {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;
    }

    .activity-tag {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .activity-time-container {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }

    .activity-priority {
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .priority-high {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
    }

    .priority-medium {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
    }

    .priority-low {
      background: rgba(34, 197, 94, 0.1);
      color: #16a34a;
    }
  `]
})
export class RecentActivityComponent {
  @Input() activities = signal<ActivityItem[]>([]);
  @Input() loading = signal(false);
  @Input() maxItems = signal(10);

  onActivityClick(activity: ActivityItem): void {
    // Emit event or handle click based on activity type
    console.log('Activity clicked:', activity);
  }

  getActivityIconClass(type: ActivityItem['type']): string {
    const classMap = {
      'document_created': 'icon-document_created',
      'document_edited': 'icon-document_edited',
      'collaboration_invited': 'icon-collaboration_invited',
      'file_uploaded': 'icon-file_uploaded',
      'comment_added': 'icon-comment_added',
      'share_created': 'icon-share_created'
    };
    return classMap[type] || 'icon-document_created';
  }

  getActivityIcon(type: ActivityItem['type']): string {
    const icons = {
      'document_created': 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
      'document_edited': 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
      'collaboration_invited': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      'file_uploaded': 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
      'comment_added': 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      'share_created': 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
    };
    return icons[type] || icons.document_created;
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }
}
