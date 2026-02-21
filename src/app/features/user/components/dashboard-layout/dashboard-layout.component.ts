import { Component, inject, signal, computed, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { ProfileDropdownComponent } from '../../../../shared/components/profile-dropdown/profile-dropdown.component';
import { Logo } from '../../../../shared/components/logo/logo';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { UserStateService } from '../../services/user-state.service';
import {NotificationBellComponent} from '../../../notifications';


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
  imports: [CommonModule, RouterModule, NotificationBellComponent, ProfileDropdownComponent, Logo],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  protected readonly userState = inject(UserStateService);
  private readonly router = inject(Router);
  private routerSubscription?: Subscription;

  // Sidebar state
  sidebarCollapsed = signal(false);
  sidebarMobileOpen = signal(false);
  activeRoute = signal('');

  // Screen size
  isMobile = signal(window.innerWidth < 1024);

  // User data from state
  readonly profile = this.userState.profile;

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
      id: 'settings-storage',
      label: 'Storage & Usage',
      icon: 'database',
      iconPath: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
      route: '/settings/storage'
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
}
