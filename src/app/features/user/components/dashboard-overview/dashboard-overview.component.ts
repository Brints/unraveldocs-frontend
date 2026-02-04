import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserStateService } from '../../services/user-state.service';
import { QuickAction } from '../../models/user.model';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-overview.component.html',
  styleUrls: ['./dashboard-overview.component.css']
})
export class DashboardOverviewComponent implements OnInit {
  private readonly userState = inject(UserStateService);

  // Time range
  selectedTimeRange = signal<'7d' | '30d' | '90d'>('30d');

  // State from service
  readonly profile = this.userState.profile;
  readonly stats = this.userState.stats;
  readonly storageInfo = this.userState.storageInfo;
  readonly statCards = this.userState.statCards;
  readonly quickActions = this.userState.quickActions;
  readonly allActivities = this.userState.activities;
  readonly subscription = this.userState.subscription;
  readonly subscriptionStatus = this.userState.subscriptionStatus;
  readonly storagePercentage = this.userState.storagePercentage;
  readonly storageStatus = this.userState.storageStatus;
  readonly ocrUsagePercentage = this.userState.ocrUsagePercentage;
  readonly isLoading = this.userState.isLoading;

  // Filtered activities based on time range
  readonly activities = computed(() => {
    const allActivities = this.allActivities();
    const timeRange = this.selectedTimeRange();
    const now = new Date();

    // Calculate the cutoff date based on time range
    const daysMap: Record<'7d' | '30d' | '90d', number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90
    };

    const cutoffDate = new Date(now.getTime() - daysMap[timeRange] * 24 * 60 * 60 * 1000);

    return allActivities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= cutoffDate;
    });
  });

  // Activity stats based on filtered activities
  readonly activityStats = computed(() => {
    const filtered = this.activities();
    const timeRange = this.selectedTimeRange();

    const completed = filtered.filter(a => a.type === 'ocr_completed').length;
    const failed = filtered.filter(a => a.type === 'ocr_failed').length;
    const uploaded = filtered.filter(a => a.type === 'file_uploaded' || a.type === 'document_created').length;

    return {
      total: filtered.length,
      completed,
      failed,
      uploaded,
      timeRangeLabel: timeRange === '7d' ? 'last 7 days' : timeRange === '30d' ? 'last 30 days' : 'last 90 days'
    };
  });

  // Greeting based on time
  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  // Math reference for template
  protected readonly Math = Math;

  ngOnInit(): void {
    // Data is loaded by the layout component
  }

  onTimeRangeChange(range: '7d' | '30d' | '90d'): void {
    this.selectedTimeRange.set(range);
  }

  executeQuickAction(action: QuickAction): void {
    if (action.action) {
      // Handle specific action types
      console.log('Executing action:', action.id);
    }
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'document_created': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      'document_edited': 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      'document_deleted': 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      'document_shared': 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
      'ocr_completed': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'ocr_failed': 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      'file_uploaded': 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
      'file_downloaded': 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
      'team_joined': 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      'team_invited': 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      'subscription_changed': 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
      'payment_completed': 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      'login': 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
      'password_changed': 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z'
    };
    return icons[type] || icons['document_created'];
  }

  getActivityColor(type: string): string {
    const colors: Record<string, string> = {
      'document_created': 'bg-blue-100 text-blue-600',
      'document_edited': 'bg-amber-100 text-amber-600',
      'document_deleted': 'bg-red-100 text-red-600',
      'document_shared': 'bg-indigo-100 text-indigo-600',
      'ocr_completed': 'bg-green-100 text-green-600',
      'ocr_failed': 'bg-red-100 text-red-600',
      'file_uploaded': 'bg-sky-100 text-sky-600',
      'file_downloaded': 'bg-teal-100 text-teal-600',
      'team_joined': 'bg-purple-100 text-purple-600',
      'team_invited': 'bg-violet-100 text-violet-600',
      'subscription_changed': 'bg-emerald-100 text-emerald-600',
      'payment_completed': 'bg-green-100 text-green-600',
      'login': 'bg-gray-100 text-gray-600',
      'password_changed': 'bg-orange-100 text-orange-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  }

  formatTimeAgo(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getStatIcon(icon: string): string {
    const icons: Record<string, string> = {
      'document': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      'ocr': 'M4 5a1 1 0 011-1h4a1 1 0 010 2H6v3a1 1 0 01-2 0V5zm16 0a1 1 0 00-1-1h-4a1 1 0 100 2h3v3a1 1 0 102 0V5zM4 19a1 1 0 001 1h4a1 1 0 100-2H6v-3a1 1 0 10-2 0v4zm16 0a1 1 0 01-1 1h-4a1 1 0 110-2h3v-3a1 1 0 112 0v4z',
      'storage': 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
      'team': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      'activity': 'M13 10V3L4 14h7v7l9-11h-7z',
      'task': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      'chart': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      'clock': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    };
    return icons[icon] || icons['document'];
  }

  getStatColorClasses(color: string): { icon: string; bg: string; text: string } {
    const colorMap: Record<string, { icon: string; bg: string; text: string }> = {
      'blue': { icon: 'bg-blue-100 text-blue-600', bg: 'bg-blue-50', text: 'text-blue-600' },
      'green': { icon: 'bg-green-100 text-green-600', bg: 'bg-green-50', text: 'text-green-600' },
      'orange': { icon: 'bg-orange-100 text-orange-600', bg: 'bg-orange-50', text: 'text-orange-600' },
      'purple': { icon: 'bg-purple-100 text-purple-600', bg: 'bg-purple-50', text: 'text-purple-600' },
      'red': { icon: 'bg-red-100 text-red-600', bg: 'bg-red-50', text: 'text-red-600' },
      'indigo': { icon: 'bg-indigo-100 text-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
      'teal': { icon: 'bg-teal-100 text-teal-600', bg: 'bg-teal-50', text: 'text-teal-600' },
      'pink': { icon: 'bg-pink-100 text-pink-600', bg: 'bg-pink-50', text: 'text-pink-600' }
    };
    return colorMap[color] || colorMap['blue'];
  }

  /**
   * Format subscription plan name for display
   * Converts "Business_Yearly" to "Business"
   */
  formatPlanName(plan: string | undefined | null): string {
    if (!plan) return 'Free';
    return plan.split('_')[0].replace(/([A-Z])/g, ' $1').trim();
  }

  /**
   * Calculate document usage percentage
   */
  getDocumentUsagePercentage(): number {
    const storage = this.storageInfo();
    if (!storage || storage.documentsUnlimited || storage.documentUploadLimit === 0) {
      return 0;
    }
    return Math.round((storage.documentsUploaded / storage.documentUploadLimit) * 100);
  }

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
  }
}

