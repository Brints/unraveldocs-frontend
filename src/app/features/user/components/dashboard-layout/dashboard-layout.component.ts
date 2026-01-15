import { Component, inject, signal, computed, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { UserStateService } from '../../services/user-state.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationStateService } from '../../../notifications/services/notification-state.service';
import { PushNotificationService } from '../../../notifications/services/push-notification.service';
import { Notification as AppNotification, NOTIFICATION_CATEGORY_MAP } from '../../../notifications/models/notification.model';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  iconPath: string;
  route: string;
  badge?: number | string;
  children?: NavItem[];
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  protected readonly userState = inject(UserStateService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly notificationState = inject(NotificationStateService);
  private readonly pushService = inject(PushNotificationService);
  private routerSubscription?: Subscription;
  private pushSubscription?: Subscription;

  // Sidebar state
  sidebarCollapsed = signal(false);
  sidebarMobileOpen = signal(false);
  activeRoute = signal('');

  // User dropdown
  userDropdownOpen = signal(false);
  notificationsOpen = signal(false);
  expandedNotificationId = signal<string | null>(null);

  // Screen size
  isMobile = signal(window.innerWidth < 1024);

  // User data from state
  readonly profile = this.userState.profile;
  readonly fullName = this.userState.fullName;
  readonly initials = this.userState.initials;

  // Notification data from NotificationStateService
  readonly unreadNotifications = this.notificationState.unreadCount;
  readonly notifications = computed(() => this.notificationState.notifications().slice(0, 5));

  // Navigation items
  readonly mainNavItems = signal<NavItem[]>([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'home',
      iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      route: '/dashboard'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: 'document',
      iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      route: '/documents'
    },
    {
      id: 'search',
      label: 'Search',
      icon: 'search',
      iconPath: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      route: '/search'
    },
    {
      id: 'ocr',
      label: 'OCR Processing',
      icon: 'scan',
      iconPath: 'M4 5a1 1 0 011-1h4a1 1 0 010 2H6v3a1 1 0 01-2 0V5zm16 0a1 1 0 00-1-1h-4a1 1 0 100 2h3v3a1 1 0 102 0V5zM4 19a1 1 0 001 1h4a1 1 0 100-2H6v-3a1 1 0 10-2 0v4zm16 0a1 1 0 01-1 1h-4a1 1 0 110-2h3v-3a1 1 0 112 0v4z',
      route: '/ocr'
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: 'users',
      iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      route: '/teams'
    }
  ]);

  readonly settingsNavItems = signal<NavItem[]>([
    {
      id: 'settings-profile',
      label: 'Profile',
      icon: 'user',
      iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      route: '/settings/profile'
    },
    {
      id: 'settings-security',
      label: 'Security',
      icon: 'shield',
      iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      route: '/settings/security'
    },
    {
      id: 'settings-billing',
      label: 'Billing',
      icon: 'credit-card',
      iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      route: '/settings/billing'
    },
    {
      id: 'settings-notifications',
      label: 'Notifications',
      icon: 'bell',
      iconPath: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
      route: '/settings/notifications'
    }
  ]);

  // Computed
  readonly currentYear = computed(() => new Date().getFullYear());

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile.set(window.innerWidth < 1024);
    if (!this.isMobile()) {
      this.sidebarMobileOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.userState.loadDashboardData();
    this.setActiveRoute(this.router.url);

    // Load notifications from API
    this.notificationState.refreshUnreadCount();
    this.notificationState.loadNotifications(true, 0, 5);
    this.notificationState.startPolling();

    // Listen for incoming push notifications
    this.pushSubscription = this.pushService.notificationReceived$.subscribe(() => {
      this.notificationState.refreshUnreadCount();
      this.notificationState.loadNotifications(true, 0, 5);
    });

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.setActiveRoute((event as NavigationEnd).url);
      if (this.isMobile()) {
        this.sidebarMobileOpen.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.pushSubscription?.unsubscribe();
    this.notificationState.stopPolling();
  }

  private setActiveRoute(url: string): void {
    this.activeRoute.set(url);
  }

  isRouteActive(route: string): boolean {
    const currentRoute = this.activeRoute();
    if (route === '/dashboard') {
      return currentRoute === '/dashboard' || currentRoute === '/';
    }
    return currentRoute.startsWith(route);
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.sidebarMobileOpen.update(v => !v);
    } else {
      this.sidebarCollapsed.update(v => !v);
    }
  }

  closeMobileSidebar(): void {
    this.sidebarMobileOpen.set(false);
  }

  toggleUserDropdown(): void {
    this.userDropdownOpen.update(v => !v);
    this.notificationsOpen.set(false);
  }

  toggleNotifications(): void {
    this.notificationsOpen.update(v => !v);
    this.userDropdownOpen.set(false);
    if (this.notificationsOpen()) {
      this.expandedNotificationId.set(null);
      this.notificationState.loadNotifications(true, 0, 5);
    }
  }

  closeDropdowns(): void {
    this.userDropdownOpen.set(false);
    this.notificationsOpen.set(false);
    this.expandedNotificationId.set(null);
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  formatTimeAgo(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      // Document notifications
      'DOCUMENT_UPLOAD_SUCCESS': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'DOCUMENT_UPLOAD_FAILED': 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      'DOCUMENT_DELETED': 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      // OCR notifications
      'OCR_PROCESSING_STARTED': 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      'OCR_PROCESSING_COMPLETED': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'OCR_PROCESSING_FAILED': 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      // Payment notifications
      'PAYMENT_SUCCESS': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'PAYMENT_FAILED': 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      'PAYMENT_REFUNDED': 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
      // Storage notifications
      'STORAGE_WARNING_80': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      'STORAGE_WARNING_90': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      'STORAGE_WARNING_95': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      'STORAGE_LIMIT_REACHED': 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      // Subscription notifications
      'SUBSCRIPTION_EXPIRING_7_DAYS': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      'SUBSCRIPTION_EXPIRING_3_DAYS': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      'SUBSCRIPTION_EXPIRING_1_DAY': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      'SUBSCRIPTION_EXPIRED': 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      'SUBSCRIPTION_RENEWED': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'SUBSCRIPTION_UPGRADED': 'M5 10l7-7m0 0l7 7m-7-7v18',
      'SUBSCRIPTION_DOWNGRADED': 'M19 14l-7 7m0 0l-7-7m7 7V3',
      // Team notifications
      'TEAM_INVITATION_RECEIVED': 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      'TEAM_MEMBER_ADDED': 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      'TEAM_MEMBER_REMOVED': 'M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6',
      'TEAM_ROLE_CHANGED': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      // System notifications
      'SYSTEM_ANNOUNCEMENT': 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
      'WELCOME': 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      // Legacy fallbacks
      'success': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'info': 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      'warning': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      'error': 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      'system': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
    };
    return icons[type] || icons['info'];
  }

  getNotificationCategory(type: string): string {
    const category = NOTIFICATION_CATEGORY_MAP[type as keyof typeof NOTIFICATION_CATEGORY_MAP] || 'system';
    const categoryColors: Record<string, string> = {
      'document': 'notification-document',
      'ocr': 'notification-ocr',
      'payment': 'notification-payment',
      'storage': 'notification-storage',
      'subscription': 'notification-subscription',
      'team': 'notification-team',
      'system': 'notification-system'
    };
    return categoryColors[category] || 'notification-system';
  }

  getNotificationColor(type: string): string {
    const colors: Record<string, string> = {
      'success': 'text-green-500',
      'info': 'text-blue-500',
      'warning': 'text-amber-500',
      'error': 'text-red-500',
      'system': 'text-gray-500'
    };
    return colors[type] || colors['info'];
  }

  markAllNotificationsAsRead(): void {
    this.notificationState.markAllAsRead();
  }

  onNotificationClick(notification: AppNotification): void {
    if (!notification.isRead) {
      this.notificationState.markAsRead(notification.id);
    }
    this.closeDropdowns();
  }

  onNotificationItemClick(notification: AppNotification, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    // Mark as read if unread
    if (!notification.isRead) {
      this.notificationState.markAsRead(notification.id);
    }

    // Toggle expanded state
    if (this.expandedNotificationId() === notification.id) {
      this.expandedNotificationId.set(null);
    } else {
      this.expandedNotificationId.set(notification.id);
    }
  }

  navigateToNotificationDetail(notification: AppNotification, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.closeDropdowns();

    // Navigate based on notification type
    const data = notification.data || {};
    switch (notification.type) {
      case 'DOCUMENT_UPLOAD_SUCCESS':
      case 'DOCUMENT_UPLOAD_FAILED':
      case 'DOCUMENT_DELETED':
      case 'OCR_PROCESSING_STARTED':
      case 'OCR_PROCESSING_COMPLETED':
      case 'OCR_PROCESSING_FAILED':
        this.router.navigate(['/documents']);
        break;
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
      case 'PAYMENT_REFUNDED':
        this.router.navigate(['/settings/billing']);
        break;
      case 'SUBSCRIPTION_EXPIRING_7_DAYS':
      case 'SUBSCRIPTION_EXPIRING_3_DAYS':
      case 'SUBSCRIPTION_EXPIRING_1_DAY':
      case 'SUBSCRIPTION_EXPIRED':
      case 'SUBSCRIPTION_RENEWED':
      case 'SUBSCRIPTION_UPGRADED':
      case 'SUBSCRIPTION_DOWNGRADED':
      case 'TRIAL_EXPIRING_SOON':
      case 'TRIAL_EXPIRED':
      case 'STORAGE_WARNING_80':
      case 'STORAGE_WARNING_90':
      case 'STORAGE_WARNING_95':
      case 'STORAGE_LIMIT_REACHED':
        this.router.navigate(['/settings/billing']);
        break;
      case 'TEAM_INVITATION_RECEIVED':
      case 'TEAM_MEMBER_ADDED':
      case 'TEAM_MEMBER_REMOVED':
      case 'TEAM_ROLE_CHANGED':
        this.router.navigate(['/teams']);
        break;
      default:
        this.router.navigate(['/notifications']);
        break;
    }
  }

  viewAllNotifications(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.closeDropdowns();
    this.router.navigate(['/notifications']);
  }

  truncateNotificationMessage(message: string, maxLength = 60): string {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  }
}
