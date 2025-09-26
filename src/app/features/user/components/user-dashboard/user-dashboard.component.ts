import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { User } from '../../../auth/models/auth.model';

interface DashboardStats {
  totalDocuments: number;
  recentActivity: number;
  storageUsed: number;
  storageLimit: number;
  collaborations: number;
}

interface RecentActivity {
  id: string;
  type: 'document_created' | 'document_edited' | 'collaboration_invited' | 'file_uploaded';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route?: string;
  action?: () => void;
  color: string;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-dashboard.html',
  styleUrls: ['./user-dashboard.css']
})
export class UserDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);

  // Signals for reactive state management
  user = signal<User | null>(null);
  stats = signal<DashboardStats>({
    totalDocuments: 0,
    recentActivity: 0,
    storageUsed: 0,
    storageLimit: 100,
    collaborations: 0
  });
  recentActivities = signal<RecentActivity[]>([]);
  isLoading = signal(true);
  selectedTimeRange = signal<'7d' | '30d' | '90d'>('30d');

  // Computed properties
  currentUser = computed(() => this.user());
  storagePercentage = computed(() => {
    const stats = this.stats();
    return Math.round((stats.storageUsed / stats.storageLimit) * 100);
  });

  storageStatus = computed(() => {
    const percentage = this.storagePercentage();
    if (percentage >= 90) return { color: 'text-red-600', bgColor: 'bg-red-100', status: 'Critical' };
    if (percentage >= 75) return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', status: 'Warning' };
    return { color: 'text-green-600', bgColor: 'bg-green-100', status: 'Good' };
  });

  quickActions = signal<QuickAction[]>([
    {
      id: 'new-document',
      title: 'Create Document',
      description: 'Start a new document',
      icon: 'document-plus',
      route: '/documents/new',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'upload-file',
      title: 'Upload File',
      description: 'Upload documents or images',
      icon: 'cloud-arrow-up',
      action: () => this.triggerFileUpload(),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'collaborate',
      title: 'Invite Collaborator',
      description: 'Share documents with team',
      icon: 'user-plus',
      route: '/collaborations/invite',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'templates',
      title: 'Browse Templates',
      description: 'Use pre-made templates',
      icon: 'squares-2x2',
      route: '/templates',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ]);

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();
  }

  private loadUserData(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user.set(currentUser);
    }
  }

  private async loadDashboardData(): Promise<void> {
    try {
      this.isLoading.set(true);

      // Simulate API calls - replace with actual service calls
      await Promise.all([
        this.loadStats(),
        this.loadRecentActivities()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadStats(): Promise<void> {
    // Simulate API call - replace with actual service
    return new Promise(resolve => {
      setTimeout(() => {
        this.stats.set({
          totalDocuments: 42,
          recentActivity: 8,
          storageUsed: 65,
          storageLimit: 100,
          collaborations: 12
        });
        resolve();
      }, 1000);
    });
  }

  private async loadRecentActivities(): Promise<void> {
    // Simulate API call - replace with actual service
    return new Promise(resolve => {
      setTimeout(() => {
        this.recentActivities.set([
          {
            id: '1',
            type: 'document_created',
            title: 'Project Proposal.docx',
            description: 'Created new document',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            icon: 'document-text'
          },
          {
            id: '2',
            type: 'collaboration_invited',
            title: 'Marketing Strategy',
            description: 'Invited john@example.com to collaborate',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            icon: 'user-plus'
          },
          {
            id: '3',
            type: 'document_edited',
            title: 'User Manual v2.0',
            description: 'Made 12 edits',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            icon: 'pencil'
          },
          {
            id: '4',
            type: 'file_uploaded',
            title: 'presentation.pptx',
            description: 'Uploaded presentation file',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            icon: 'cloud-arrow-up'
          }
        ]);
        resolve();
      }, 800);
    });
  }

  triggerFileUpload(): void {
    // Implement file upload logic
    console.log('File upload triggered');
  }

  onTimeRangeChange(range: '7d' | '30d' | '90d'): void {
    this.selectedTimeRange.set(range);
    this.loadDashboardData();
  }

  getActivityIcon(type: RecentActivity['type']): string {
    const icons = {
      'document_created': 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
      'document_edited': 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
      'collaboration_invited': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      'file_uploaded': 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
    };
    return icons[type] || icons.document_created;
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  protected readonly Math = Math;
}
