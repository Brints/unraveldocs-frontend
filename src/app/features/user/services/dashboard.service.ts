import { Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface DashboardData {
  stats: {
    totalDocuments: number;
    recentActivity: number;
    storageUsed: number;
    storageLimit: number;
    collaborations: number;
    tasksCompleted: number;
    pendingReviews: number;
  };
  recentActivities: Array<{
    id: string;
    type: 'document_created' | 'document_edited' | 'collaboration_invited' | 'file_uploaded';
    title: string;
    description: string;
    timestamp: Date;
    user?: { name: string; avatar?: string };
    metadata?: Record<string, any>;
  }>;
  notifications: Array<{
    id: string;
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>;
  quickActions: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    route?: string;
    action?: () => void;
    color: string;
    enabled: boolean;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = 'https://your-api-url.com/api';

  // Real-time data streams
  private dashboardData$ = new BehaviorSubject<DashboardData | null>(null);
  private isLoading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);

  // Signals for reactive UI
  public readonly dashboardData = signal<DashboardData | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {
    // Set up real-time updates every 30 seconds
    this.setupRealTimeUpdates();
  }

  /**
   * Load initial dashboard data
   */
  async loadDashboardData(): Promise<void> {
    try {
      this.setLoading(true);
      this.setError(null);

      // Simulate API call - replace with actual HTTP calls
      const data = await this.fetchDashboardData();

      this.dashboardData.set(data);
      this.dashboardData$.next(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      this.setError(errorMessage);
      console.error('Dashboard data loading error:', error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Refresh dashboard stats
   */
  async refreshStats(): Promise<void> {
    try {
      const currentData = this.dashboardData();
      if (!currentData) return;

      const stats = await this.fetchStats();
      const updatedData = { ...currentData, stats };

      this.dashboardData.set(updatedData);
      this.dashboardData$.next(updatedData);
    } catch (error) {
      console.error('Stats refresh error:', error);
    }
  }

  /**
   * Refresh recent activities
   */
  async refreshActivities(): Promise<void> {
    try {
      const currentData = this.dashboardData();
      if (!currentData) return;

      const recentActivities = await this.fetchRecentActivities();
      const updatedData = { ...currentData, recentActivities };

      this.dashboardData.set(updatedData);
      this.dashboardData$.next(updatedData);
    } catch (error) {
      console.error('Activities refresh error:', error);
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      // Simulate API call
      await this.updateNotificationStatus(notificationId, true);

      const currentData = this.dashboardData();
      if (!currentData) return;

      const updatedNotifications = currentData.notifications.map(notification =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      );

      const updatedData = { ...currentData, notifications: updatedNotifications };
      this.dashboardData.set(updatedData);
    } catch (error) {
      console.error('Notification update error:', error);
    }
  }

  /**
   * Get dashboard data as observable
   */
  getDashboardData(): Observable<DashboardData | null> {
    return this.dashboardData$.asObservable();
  }

  /**
   * Get loading state as observable
   */
  getLoadingState(): Observable<boolean> {
    return this.isLoading$.asObservable();
  }

  /**
   * Get error state as observable
   */
  getErrorState(): Observable<string | null> {
    return this.error$.asObservable();
  }

  // Private methods

  private async fetchDashboardData(): Promise<DashboardData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      stats: {
        totalDocuments: 42,
        recentActivity: 8,
        storageUsed: 65,
        storageLimit: 100,
        collaborations: 12,
        tasksCompleted: 28,
        pendingReviews: 5
      },
      recentActivities: [
        {
          id: '1',
          type: 'document_created',
          title: 'Project Proposal.docx',
          description: 'Created new document',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          user: { name: 'John Doe', avatar: '/assets/avatars/john.jpg' },
          metadata: { priority: 'high', tags: ['proposal', 'project'] }
        },
        {
          id: '2',
          type: 'collaboration_invited',
          title: 'Marketing Strategy',
          description: 'Invited sarah@example.com to collaborate',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          user: { name: 'You' },
          metadata: { priority: 'medium' }
        },
        {
          id: '3',
          type: 'document_edited',
          title: 'User Manual v2.0',
          description: 'Made 12 edits',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          user: { name: 'Alice Smith', avatar: '/assets/avatars/alice.jpg' },
          metadata: { priority: 'low', tags: ['manual', 'documentation'] }
        }
      ],
      notifications: [
        {
          id: '1',
          type: 'info',
          title: 'Storage Alert',
          message: 'You are using 85% of your storage quota',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          read: false
        },
        {
          id: '2',
          type: 'success',
          title: 'Document Shared',
          message: 'Your document has been successfully shared with the team',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          read: true
        }
      ],
      quickActions: [
        {
          id: 'new-document',
          title: 'Create Document',
          description: 'Start a new document',
          icon: 'document-plus',
          route: '/documents/new',
          color: 'bg-blue-500 hover:bg-blue-600',
          enabled: true
        },
        {
          id: 'upload-file',
          title: 'Upload File',
          description: 'Upload documents or images',
          icon: 'cloud-arrow-up',
          color: 'bg-green-500 hover:bg-green-600',
          enabled: true
        },
        {
          id: 'collaborate',
          title: 'Invite Collaborator',
          description: 'Share documents with team',
          icon: 'user-plus',
          route: '/collaborations/invite',
          color: 'bg-purple-500 hover:bg-purple-600',
          enabled: true
        },
        {
          id: 'templates',
          title: 'Browse Templates',
          description: 'Use pre-made templates',
          icon: 'squares-2x2',
          route: '/templates',
          color: 'bg-indigo-500 hover:bg-indigo-600',
          enabled: true
        }
      ]
    };
  }

  private async fetchStats(): Promise<DashboardData['stats']> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      totalDocuments: Math.floor(Math.random() * 50) + 40,
      recentActivity: Math.floor(Math.random() * 10) + 5,
      storageUsed: Math.floor(Math.random() * 30) + 60,
      storageLimit: 100,
      collaborations: Math.floor(Math.random() * 5) + 10,
      tasksCompleted: Math.floor(Math.random() * 10) + 25,
      pendingReviews: Math.floor(Math.random() * 8) + 2
    };
  }

  private async fetchRecentActivities(): Promise<DashboardData['recentActivities']> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return updated activities with latest timestamps
    return [
      {
        id: Date.now().toString(),
        type: 'document_created',
        title: 'New Research Report.pdf',
        description: 'Created new document',
        timestamp: new Date(),
        user: { name: 'You' }
      }
      // ... existing activities
    ];
  }

  private async updateNotificationStatus(id: string, read: boolean): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    // In real implementation, make HTTP PUT/PATCH request
  }

  private setupRealTimeUpdates(): void {
    // Update stats every 30 seconds
    interval(30000).subscribe(() => {
      if (this.dashboardData()) {
        this.refreshStats();
      }
    });

    // Update activities every 2 minutes
    interval(120000).subscribe(() => {
      if (this.dashboardData()) {
        this.refreshActivities();
      }
    });
  }

  private setLoading(loading: boolean): void {
    this.isLoading.set(loading);
    this.isLoading$.next(loading);
  }

  private setError(error: string | null): void {
    this.error.set(error);
    this.error$.next(error);
  }
}
