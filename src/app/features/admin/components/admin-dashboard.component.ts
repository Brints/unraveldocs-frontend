import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChartsService, ChartDataSets } from '../../../shared/services/charts.service';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDocuments: number;
  storageUsed: number;
  totalRevenue: number;
  newSignupsToday: number;
  systemUptime: number;
  averageResponseTime: number;
}

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'pending';
}

interface AdminNotification {
  id: string;
  type: 'security' | 'system' | 'user' | 'billing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionRequired: boolean;
}

interface QuickAdminAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route?: string;
  action?: () => void;
  color: string;
  permissions?: string[];
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    // LineChartComponent,
    // DonutChartComponent,
    // BarChartComponent,
    // AreaChartComponent
  ],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly chartsService = inject(ChartsService);
  private subscriptions = new Subscription();

  // Signals for reactive state management
  stats = signal<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalDocuments: 0,
    storageUsed: 0,
    totalRevenue: 0,
    newSignupsToday: 0,
    systemUptime: 0,
    averageResponseTime: 0
  });

  systemMetrics = signal<SystemMetric[]>([]);
  userActivities = signal<UserActivity[]>([]);
  notifications = signal<AdminNotification[]>([]);
  chartData = signal<ChartDataSets | null>(null);
  isLoading = signal(true);
  selectedTimeRange = signal<'1h' | '24h' | '7d' | '30d'>('24h');
  selectedView = signal<'overview' | 'users' | 'system' | 'analytics'>('overview');

  // Computed properties
  criticalNotifications = computed(() =>
    this.notifications().filter(n => n.severity === 'critical' && !n.read)
  );

  systemHealth = computed(() => {
    const metrics = this.systemMetrics();
    const criticalCount = metrics.filter(m => m.status === 'critical').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;

    if (criticalCount > 0) return { status: 'critical', message: `${criticalCount} critical issues` };
    if (warningCount > 0) return { status: 'warning', message: `${warningCount} warnings` };
    return { status: 'healthy', message: 'All systems operational' };
  });

  revenueGrowth = computed(() => {
    const currentRevenue = this.stats().totalRevenue;
    // Simulate previous period revenue for growth calculation
    const previousRevenue = currentRevenue * 0.85;
    const growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    return Math.round(growth * 100) / 100;
  });

  quickActions = signal<QuickAdminAction[]>([
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: 'users',
      route: '/admin/users',
      color: 'bg-blue-500 hover:bg-blue-600',
      permissions: ['manage_users']
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'Configure system parameters',
      icon: 'cog',
      route: '/admin/settings',
      color: 'bg-gray-500 hover:bg-gray-600',
      permissions: ['manage_system']
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View detailed analytics',
      icon: 'chart-bar',
      route: '/admin/analytics',
      color: 'bg-green-500 hover:bg-green-600',
      permissions: ['view_analytics']
    },
    {
      id: 'security',
      title: 'Security Center',
      description: 'Monitor security events',
      icon: 'shield',
      route: '/admin/security',
      color: 'bg-red-500 hover:bg-red-600',
      permissions: ['manage_security']
    },
    {
      id: 'backup',
      title: 'Backup & Recovery',
      description: 'Manage system backups',
      icon: 'database',
      action: () => this.initiateBackup(),
      color: 'bg-purple-500 hover:bg-purple-600',
      permissions: ['manage_backups']
    },
    {
      id: 'maintenance',
      title: 'Maintenance Mode',
      description: 'Enable maintenance mode',
      icon: 'wrench',
      action: () => this.toggleMaintenanceMode(),
      color: 'bg-yellow-500 hover:bg-yellow-600',
      permissions: ['manage_system']
    }
  ]);

  ngOnInit(): void {
    this.loadAdminData();
    this.loadChartData();
    this.setupRealTimeUpdates();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private async loadAdminData(): Promise<void> {
    try {
      this.isLoading.set(true);

      await Promise.all([
        this.loadStats(),
        this.loadSystemMetrics(),
        this.loadUserActivities(),
        this.loadNotifications()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private loadChartData(): void {
    // Get chart data directly from service signal
    const chartDataSignal = this.chartsService.getChartData();
    this.chartData.set(chartDataSignal());
  }

  async refreshChartData(): Promise<void> {
    await this.chartsService.refreshChartData();
  }

  private async loadStats(): Promise<void> {
    // Simulate API call
    return new Promise(resolve => {
      setTimeout(() => {
        this.stats.set({
          totalUsers: 15248,
          activeUsers: 8932,
          totalDocuments: 124567,
          storageUsed: 2847, // GB
          totalRevenue: 127450.75,
          newSignupsToday: 23,
          systemUptime: 99.97,
          averageResponseTime: 142 // ms
        });
        resolve();
      }, 1000);
    });
  }

  private async loadSystemMetrics(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.systemMetrics.set([
          {
            id: 'cpu',
            name: 'CPU Usage',
            value: 68,
            unit: '%',
            status: 'warning',
            trend: 'up',
            trendValue: 5.2
          },
          {
            id: 'memory',
            name: 'Memory Usage',
            value: 82,
            unit: '%',
            status: 'warning',
            trend: 'stable',
            trendValue: 0.1
          },
          {
            id: 'disk',
            name: 'Disk Usage',
            value: 45,
            unit: '%',
            status: 'healthy',
            trend: 'down',
            trendValue: -2.1
          },
          {
            id: 'network',
            name: 'Network I/O',
            value: 234,
            unit: 'MB/s',
            status: 'healthy',
            trend: 'up',
            trendValue: 12.5
          },
          {
            id: 'database',
            name: 'DB Connections',
            value: 89,
            unit: 'active',
            status: 'healthy',
            trend: 'stable',
            trendValue: 0.3
          },
          {
            id: 'cache',
            name: 'Cache Hit Rate',
            value: 94.5,
            unit: '%',
            status: 'healthy',
            trend: 'up',
            trendValue: 1.8
          }
        ]);
        resolve();
      }, 800);
    });
  }

  private async loadUserActivities(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.userActivities.set([
          {
            id: '1',
            userId: 'user_123',
            userName: 'John Doe',
            userEmail: 'john.doe@example.com',
            action: 'Document Created',
            resource: 'Project Proposal.docx',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            ipAddress: '192.168.1.100',
            userAgent: 'Chrome/91.0',
            status: 'success'
          },
          {
            id: '2',
            userId: 'user_456',
            userName: 'Jane Smith',
            userEmail: 'jane.smith@example.com',
            action: 'Login Attempt',
            resource: 'Authentication',
            timestamp: new Date(Date.now() - 12 * 60 * 1000),
            ipAddress: '10.0.0.45',
            userAgent: 'Firefox/89.0',
            status: 'failed'
          },
          {
            id: '3',
            userId: 'user_789',
            userName: 'Bob Johnson',
            userEmail: 'bob.johnson@example.com',
            action: 'File Upload',
            resource: 'presentation.pptx',
            timestamp: new Date(Date.now() - 18 * 60 * 1000),
            ipAddress: '172.16.0.23',
            userAgent: 'Safari/14.0',
            status: 'success'
          }
        ]);
        resolve();
      }, 600);
    });
  }

  private async loadNotifications(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.notifications.set([
          {
            id: '1',
            type: 'security',
            severity: 'high',
            title: 'Multiple Failed Login Attempts',
            message: 'User jane.smith@example.com has 5 failed login attempts in the last hour',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            read: false,
            actionRequired: true
          },
          {
            id: '2',
            type: 'system',
            severity: 'medium',
            title: 'High Memory Usage',
            message: 'Server memory usage is above 80%',
            timestamp: new Date(Date.now() - 45 * 60 * 1000),
            read: false,
            actionRequired: false
          },
          {
            id: '3',
            type: 'billing',
            severity: 'low',
            title: 'Monthly Report Ready',
            message: 'Your monthly billing report is ready for review',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            read: true,
            actionRequired: false
          }
        ]);
        resolve();
      }, 400);
    });
  }

  private setupRealTimeUpdates(): void {
    // Simulate real-time updates every 30 seconds
    const interval = setInterval(() => {
      this.loadStats();
      this.loadSystemMetrics();
    }, 30000);

    this.subscriptions.add(() => clearInterval(interval));
  }

  onTimeRangeChange(range: '1h' | '24h' | '7d' | '30d'): void {
    this.selectedTimeRange.set(range);
    this.loadAdminData();
  }

  onViewChange(view: 'overview' | 'users' | 'system' | 'analytics'): void {
    this.selectedView.set(view);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notifications = this.notifications();
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );
    this.notifications.set(updatedNotifications);
  }

  async dismissNotification(notificationId: string): Promise<void> {
    const notifications = this.notifications();
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    this.notifications.set(updatedNotifications);
  }

  getMetricStatusColor(status: SystemMetric['status']): string {
    const colors = {
      healthy: 'text-green-600',
      warning: 'text-yellow-600',
      critical: 'text-red-600'
    };
    return colors[status];
  }

  getNotificationIcon(type: AdminNotification['type']): string {
    const icons = {
      security: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
      system: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      billing: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
    };
    return icons[type];
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Quick Action Methods
  initiateBackup(): void {
    console.log('Initiating system backup...');
    // Implement backup logic
  }

  toggleMaintenanceMode(): void {
    console.log('Toggling maintenance mode...');
    // Implement maintenance mode toggle
  }

  exportUserActivity(): void {
    console.log('Exporting user activity...');
    // Implement export functionality
  }

  refreshSystemMetrics(): void {
    this.loadSystemMetrics();
  }

  getActionIconPath(icon: string): string {
    const iconPaths = {
      'users': 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      'cog': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      'chart-bar': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      'shield': 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      'database': 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
      'wrench': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
    };
    return iconPaths[icon as keyof typeof iconPaths] || iconPaths.cog;
  }

  // Template Helper Methods
  getUnreadNotificationsCount(): number {
    return this.notifications().filter(n => !n.read).length;
  }
}
