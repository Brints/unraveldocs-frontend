import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, of, tap, finalize, forkJoin } from 'rxjs';
import { UserApiService } from './user-api.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { User } from '../../../core/auth/models/auth.model';
import {
  UserProfile,
  DashboardStats,
  StorageInfo,
  Activity,
  Notification,
  Subscription,
  Team,
  DocumentSummary,
  RecentCollection,
  StatCard,
  QuickAction,
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private readonly api = inject(UserApiService);
  private readonly authService = inject(AuthService);

  // ==================== Core State Signals ====================

  private readonly _profile = signal<UserProfile | null>(null);
  private readonly _stats = signal<DashboardStats | null>(null);
  private readonly _storageInfo = signal<StorageInfo | null>(null);
  private readonly _recentCollections = signal<RecentCollection[]>([]);
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
  readonly storageInfo = this._storageInfo.asReadonly();
  readonly activities = this._activities.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly subscription = this._subscription.asReadonly();
  readonly teams = this._teams.asReadonly();
  readonly documents = this._documents.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

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

  readonly storagePercentage = computed(() => {
    const storage = this._storageInfo();
    if (!storage || storage.storageLimit === 0) return 0;
    return storage.percentageUsed;
  });

  readonly ocrUsagePercentage = computed(() => {
    const storage = this._storageInfo();
    if (!storage || storage.ocrPageLimit === 0 || storage.ocrUnlimited) return 0;
    return Math.round((storage.ocrPagesUsed / storage.ocrPageLimit) * 100);
  });

  readonly storageStatus = computed(() => {
    const storage = this._storageInfo();
    const percentage = storage?.percentageUsed ?? 0;
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
    const storage = this._storageInfo();

    // Return empty if no storage data yet
    if (!storage) return [];

    return [
      {
        id: 'documents',
        title: 'Documents',
        value: `${storage.documentsUploaded}`,
        icon: 'document',
        color: storage.documentQuotaExceeded ? 'red' : 'blue',
        subtitle: storage.documentsUnlimited
          ? 'Unlimited'
          : `${storage.documentsRemaining} remaining of ${storage.documentUploadLimit}`,
        link: '/documents'
      },
      {
        id: 'ocr',
        title: 'OCR Pages',
        value: storage.ocrUnlimited
          ? `${storage.ocrPagesUsed}`
          : `${storage.ocrPagesUsed}/${storage.ocrPageLimit}`,
        icon: 'ocr',
        color: storage.ocrQuotaExceeded ? 'red' : 'purple',
        subtitle: storage.ocrUnlimited
          ? 'Unlimited'
          : `${storage.ocrPagesRemaining} remaining`,
        link: '/subscriptions'
      },
      {
        id: 'storage',
        title: 'Storage',
        value: storage.storageUsedFormatted,
        icon: 'storage',
        color: this.storageStatus().color === 'red' ? 'red' :
               this.storageStatus().color === 'amber' ? 'orange' : 'green',
        subtitle: storage.unlimited
          ? 'Unlimited'
          : `${storage.storageUsedFormatted} of ${storage.storageLimitFormatted}`,
        link: '/settings/billing'
      },
      {
        id: 'plan',
        title: 'Plan',
        value: this.formatPlanName(storage.subscriptionPlan),
        icon: 'chart',
        color: 'indigo',
        subtitle: storage.billingInterval,
        link: '/subscriptions'
      }
    ];
  });

  /**
   * Format subscription plan name for display
   */
  private formatPlanName(plan: string): string {
    if (!plan) return 'Free';
    // Convert "Business_Yearly" to "Business"
    return plan.split('_')[0].replace(/([A-Z])/g, ' $1').trim();
  }

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

  // ==================== Actions ====================

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this._isLoading.set(true);
    this._error.set(null);

    // Load user profile from auth service as initial data
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.setProfileFromUser(currentUser);
    }

    // Subscribe to auth changes
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.setProfileFromUser(user);
      }
    });

    // Fetch fresh profile data from API (includes profilePicture)
    this.refreshProfile();

    forkJoin({
      // Load collections/documents
      collections: this.api.getCollections().pipe(catchError(() => of([]))),
      teams: this.api.getTeams().pipe(catchError(() => of([]))),
      // Load storage info from API
      storageInfo: this.api.getStorageInfo().pipe(catchError(() => of(null))),
    }).pipe(
      tap(data => {
        if (data.teams) this._teams.set(data.teams);

        // Set storage info from API
        if (data.storageInfo) {
          this._storageInfo.set(data.storageInfo);
        }

        // Set collections and generate activities from them
        if (data.collections) {
          this._recentCollections.set(data.collections);
          this.generateActivitiesFromCollections(data.collections);
        }

        // Load mock subscription until API is ready
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
   * Generate activities from recent collections
   */
  private generateActivitiesFromCollections(collections: RecentCollection[]): void {
    const activities: Activity[] = collections
      .slice(0, 10) // Limit to 10 most recent
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(collection => {
        const activityType = this.getActivityTypeFromStatus(collection.collectionStatus);
        return {
          id: collection.id,
          type: activityType,
          title: `Collection ${collection.id.substring(0, 8)}...`,
          description: this.getActivityDescription(collection),
          timestamp: collection.updatedAt || collection.createdAt,
          document: {
            id: collection.id,
            name: `${collection.fileCount} file${collection.fileCount !== 1 ? 's' : ''}`,
            collectionId: collection.id
          }
        };
      });

    this._activities.set(activities);
  }

  /**
   * Get activity type based on collection status
   */
  private getActivityTypeFromStatus(status: string): Activity['type'] {
    switch (status) {
      case 'completed':
      case 'processed':
        return 'ocr_completed';
      case 'processing':
      case 'pending':
        return 'file_uploaded';
      case 'failed':
      case 'failed_ocr':
        return 'ocr_failed';
      default:
        return 'document_created';
    }
  }

  /**
   * Get activity description based on collection
   */
  private getActivityDescription(collection: RecentCollection): string {
    const fileText = collection.fileCount === 1 ? '1 file' : `${collection.fileCount} files`;

    switch (collection.collectionStatus) {
      case 'completed':
      case 'processed':
        return `OCR processing completed for ${fileText}`;
      case 'processing':
        return `Processing ${fileText}...`;
      case 'pending':
        return `${fileText} uploaded, waiting for processing`;
      case 'failed':
      case 'failed_ocr':
        return `OCR processing failed for ${fileText}`;
      default:
        return `${fileText} uploaded`;
    }
  }

  /**
   * Set profile from User object
   */
  private setProfileFromUser(user: User): void {
    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      phoneNumber: user.phoneNumber,
      country: user.country,
      profession: user.profession,
      organization: user.organization,
      role: (user.role?.toUpperCase() as UserProfile['role']) || 'USER',
      isVerified: user.isVerified ?? user.emailVerified ?? false,
      isActive: user.isActive ?? true,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    this._profile.set(profile);
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
   * Load storage info with loading state
   */
  loadStorageInfo(): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.getStorageInfo().pipe(
      tap(storageInfo => this._storageInfo.set(storageInfo)),
      catchError(error => {
        this._error.set('Failed to load storage information');
        console.error('Storage info load error:', error);
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

  // ==================== Mock Data Methods (temporary until API is ready) ====================


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
}

