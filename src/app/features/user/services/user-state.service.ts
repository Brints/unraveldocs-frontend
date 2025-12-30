import { Injectable, inject, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, tap, finalize, forkJoin } from 'rxjs';
import { UserApiService } from './user-api.service';
import {
  UserProfile,
  DashboardStats,
  Activity,
  Notification,
  Subscription,
  Team,
  DocumentSummary,
  DashboardState,
  UpdateProfileRequest,
  StatCard,
  QuickAction,
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private readonly api = inject(UserApiService);

  // ==================== Core State Signals ====================

  private readonly _profile = signal<UserProfile | null>(null);
  private readonly _stats = signal<DashboardStats | null>(null);
  private readonly _activities = signal<Activity[]>([]);
  private readonly _notifications = signal<Notification[]>([]);
  private readonly _subscription = signal<Subscription | null>(null);
  private readonly _teams = signal<Team[]>([]);
  private readonly _documents = signal<DocumentSummary | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastUpdated = signal<string | null>(null);

  // ==================== Public Readonly Signals ====================

  readonly profile = this._profile.asReadonly();
  readonly stats = this._stats.asReadonly();
  readonly activities = this._activities.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly subscription = this._subscription.asReadonly();
  readonly teams = this._teams.asReadonly();
  readonly documents = this._documents.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastUpdated = this._lastUpdated.asReadonly();

  // ==================== Computed Properties ====================

  readonly fullName = computed(() => {
    const profile = this._profile();
    if (!profile) return '';
    return `${profile.firstName} ${profile.lastName}`;
  });

  readonly initials = computed(() => {
    const profile = this._profile();
    if (!profile) return '';
    return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  });

  readonly unreadNotificationsCount = computed(() => {
    return this._notifications().filter(n => !n.read).length;
  });

  readonly storagePercentage = computed(() => {
    const stats = this._stats();
    if (!stats || stats.storageLimit === 0) return 0;
    return Math.round((stats.storageUsed / stats.storageLimit) * 100);
  });

  readonly ocrUsagePercentage = computed(() => {
    const stats = this._stats();
    if (!stats || stats.ocrPagesLimit === 0) return 0;
    return Math.round((stats.ocrPagesUsed / stats.ocrPagesLimit) * 100);
  });

  readonly storageStatus = computed(() => {
    const percentage = this.storagePercentage();
    if (percentage >= 90) return { status: 'critical', color: 'red', message: 'Storage almost full' };
    if (percentage >= 75) return { status: 'warning', color: 'amber', message: 'Storage running low' };
    return { status: 'healthy', color: 'green', message: 'Storage healthy' };
  });

  readonly subscriptionStatus = computed(() => {
    const sub = this._subscription();
    if (!sub) return { isActive: false, isPaid: false, isTrial: false };
    return {
      isActive: sub.status === 'ACTIVE' || sub.status === 'TRIALING',
      isPaid: sub.planName !== 'FREE',
      isTrial: sub.status === 'TRIALING',
      daysRemaining: sub.trialEndsAt
        ? Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null
    };
  });

  readonly statCards = computed<StatCard[]>(() => {
    const stats = this._stats();
    if (!stats) return [];

    return [
      {
        id: 'documents',
        title: 'Total Documents',
        value: stats.totalDocuments,
        icon: 'document',
        color: 'blue',
        change: {
          value: `+${stats.documentsThisMonth} this month`,
          percentage: 12,
          type: 'increase'
        },
        link: '/documents'
      },
      {
        id: 'ocr',
        title: 'OCR Pages Used',
        value: `${stats.ocrPagesUsed}/${stats.ocrPagesLimit}`,
        icon: 'ocr',
        color: 'purple',
        subtitle: `${this.ocrUsagePercentage()}% used`,
        link: '/subscriptions'
      },
      {
        id: 'storage',
        title: 'Storage',
        value: `${stats.storageUsed}GB`,
        icon: 'storage',
        color: this.storageStatus().color === 'red' ? 'red' :
               this.storageStatus().color === 'amber' ? 'orange' : 'green',
        subtitle: `${stats.storageUsed}GB of ${stats.storageLimit}GB`,
        link: '/settings/billing'
      },
      {
        id: 'teams',
        title: 'Teams',
        value: stats.teamsCount,
        icon: 'team',
        color: 'indigo',
        change: {
          value: `${stats.collaborations} collaborations`,
          percentage: 0,
          type: 'neutral'
        },
        link: '/teams'
      }
    ];
  });

  readonly quickActions = computed<QuickAction[]>(() => {
    const sub = this._subscription();
    const canUpload = sub?.status === 'ACTIVE' || sub?.status === 'TRIALING';

    return [
      {
        id: 'upload',
        title: 'Upload Documents',
        description: 'Upload and process new documents',
        icon: 'upload',
        iconPath: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
        route: '/documents/upload',
        color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        enabled: canUpload ?? false
      },
      {
        id: 'new-collection',
        title: 'New Collection',
        description: 'Create a document collection',
        icon: 'folder-plus',
        iconPath: 'M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z',
        route: '/documents/collections/new',
        color: 'bg-gradient-to-r from-green-500 to-green-600',
        enabled: true
      },
      {
        id: 'ocr',
        title: 'Extract Text (OCR)',
        description: 'Process documents with OCR',
        icon: 'scan',
        iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        route: '/documents/ocr',
        color: 'bg-gradient-to-r from-purple-500 to-purple-600',
        enabled: canUpload ?? false
      },
      {
        id: 'team',
        title: 'Manage Teams',
        description: 'View and manage your teams',
        icon: 'users',
        iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        route: '/teams',
        color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
        enabled: true
      }
    ];
  });

  // ==================== Observable Streams (for components that need them) ====================

  readonly profile$ = toObservable(this._profile);
  readonly isLoading$ = toObservable(this._isLoading);

  // ==================== Actions ====================

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this._isLoading.set(true);
    this._error.set(null);

    forkJoin({
      profile: this.api.getProfile().pipe(catchError(() => of(null))),
      // Stats endpoint may not exist yet, use mock data
      // stats: this.api.getDashboardStats().pipe(catchError(() => of(null))),
      // activities: this.api.getActivities().pipe(catchError(() => of({ items: [] }))),
      // notifications: this.api.getNotifications().pipe(catchError(() => of({ items: [] }))),
      // subscription: this.api.getSubscription().pipe(catchError(() => of(null))),
      teams: this.api.getTeams().pipe(catchError(() => of([]))),
      // documents: this.api.getDocumentSummary().pipe(catchError(() => of(null))),
    }).pipe(
      tap(data => {
        if (data.profile) this._profile.set(data.profile);
        // if (data.stats) this._stats.set(data.stats);
        // if (data.activities?.items) this._activities.set(data.activities.items);
        // if (data.notifications?.items) this._notifications.set(data.notifications.items);
        // if (data.subscription) this._subscription.set(data.subscription);
        if (data.teams) this._teams.set(data.teams);
        // if (data.documents) this._documents.set(data.documents);

        // Load mock stats for now
        this.loadMockStats();
        this.loadMockActivities();
        this.loadMockSubscription();

        this._lastUpdated.set(new Date().toISOString());
      }),
      catchError(error => {
        this._error.set('Failed to load dashboard data. Please try again.');
        console.error('Dashboard load error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Refresh profile data
   */
  refreshProfile(): void {
    this.api.getProfile().pipe(
      tap(profile => this._profile.set(profile)),
      catchError(error => {
        console.error('Profile refresh error:', error);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Update profile
   */
  updateProfile(data: UpdateProfileRequest): void {
    const profile = this._profile();
    if (!profile) return;

    this._isLoading.set(true);
    this.api.updateProfile(profile.id, data).pipe(
      tap(updatedProfile => {
        this._profile.set(updatedProfile);
      }),
      catchError(error => {
        this._error.set('Failed to update profile');
        console.error('Profile update error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Upload profile picture
   */
  uploadProfilePicture(file: File): void {
    const profile = this._profile();
    if (!profile) return;

    this._isLoading.set(true);
    this.api.uploadProfilePicture(profile.id, file).pipe(
      tap(imageUrl => {
        this._profile.update(p => p ? { ...p, profilePicture: imageUrl } : null);
      }),
      catchError(error => {
        this._error.set('Failed to upload profile picture');
        console.error('Profile picture upload error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): void {
    this._notifications.update(notifications =>
      notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );

    this.api.markNotificationAsRead(notificationId).pipe(
      catchError(error => {
        console.error('Mark notification error:', error);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead(): void {
    this._notifications.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );

    this.api.markAllNotificationsAsRead().pipe(
      catchError(error => {
        console.error('Mark all notifications error:', error);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }

  // ==================== Mock Data Methods (temporary until API is ready) ====================

  private loadMockStats(): void {
    this._stats.set({
      totalDocuments: 47,
      documentsThisMonth: 12,
      ocrPagesUsed: 89,
      ocrPagesLimit: 150,
      storageUsed: 2.4,
      storageLimit: 5,
      collaborations: 8,
      teamsCount: 2,
      pendingTasks: 5,
      completedTasks: 23
    });
  }

  private loadMockActivities(): void {
    this._activities.set([
      {
        id: '1',
        type: 'document_created',
        title: 'Project Proposal.pdf',
        description: 'New document uploaded',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        document: { id: 'doc1', name: 'Project Proposal.pdf', collectionId: 'col1' }
      },
      {
        id: '2',
        type: 'ocr_completed',
        title: 'Invoice_2024.jpg',
        description: 'OCR processing completed successfully',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        document: { id: 'doc2', name: 'Invoice_2024.jpg', collectionId: 'col1' }
      },
      {
        id: '3',
        type: 'team_joined',
        title: 'Marketing Team',
        description: 'You joined a new team',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        type: 'document_shared',
        title: 'Q4 Report.docx',
        description: 'Document shared with john@example.com',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        document: { id: 'doc3', name: 'Q4 Report.docx', collectionId: 'col2' }
      },
      {
        id: '5',
        type: 'file_uploaded',
        title: 'Presentation.pptx',
        description: 'File uploaded successfully',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        document: { id: 'doc4', name: 'Presentation.pptx', collectionId: 'col2' }
      }
    ]);
  }

  private loadMockSubscription(): void {
    this._subscription.set({
      id: 'sub_1',
      planId: 'plan_starter',
      planName: 'STARTER',
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      price: 9,
      currency: 'USD',
      currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      features: [
        { name: 'Documents per month', included: true, limit: 30, used: 12 },
        { name: 'OCR pages', included: true, limit: 150, used: 89 },
        { name: 'Storage', included: true, limit: 5 },
        { name: 'Team collaboration', included: false }
      ]
    });
  }

  private loadMockNotifications(): void {
    this._notifications.set([
      {
        id: '1',
        type: 'success',
        title: 'OCR Complete',
        message: 'Your document has been processed successfully',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        read: false,
        actionUrl: '/documents/doc1'
      },
      {
        id: '2',
        type: 'info',
        title: 'New Feature',
        message: 'Check out our new batch processing feature',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: false
      },
      {
        id: '3',
        type: 'warning',
        title: 'Storage Warning',
        message: 'You are using 80% of your storage',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        read: true
      }
    ]);
  }
}

