import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';
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

  // Real-time data streams
  private dashboardData$ = new BehaviorSubject<DashboardData | null>(null);

  // Signals for reactive UI
  public readonly dashboardData = signal<DashboardData | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {
    // Set up real-time updates every 30 seconds
    this.setupRealTimeUpdates();
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

  // Private methods

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
    ];
  }

  private setupRealTimeUpdates(): void {
    // Update stats every 30 seconds
    interval(30000).subscribe(async () => {
      if (this.dashboardData()) {
        await this.refreshStats();
      }
    });

    // Update activities every 2 minutes
    interval(120000).subscribe(async () => {
      if (this.dashboardData()) {
        await this.refreshActivities();
      }
    });
  }
}
