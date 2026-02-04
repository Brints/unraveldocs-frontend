import { Component, inject, signal, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';

export interface ProfileDropdownUser {
  profilePicture?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface DropdownMenuItem {
  id: string;
  label: string;
  route?: string;
  icon: string;
  action?: () => void;
  isDanger?: boolean;
  dividerBefore?: boolean;
}

@Component({
  selector: 'app-profile-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile-dropdown.component.html',
  styleUrls: ['./profile-dropdown.component.css']
})
export class ProfileDropdownComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  @Input() user: ProfileDropdownUser | null = null;
  @Input() showUserInfo = true;
  @Input() menuItems: DropdownMenuItem[] = [];

  @Output() menuItemClicked = new EventEmitter<string>();
  @Output() loggedOut = new EventEmitter<void>();

  isOpen = signal(false);

  // Default menu items if none provided
  readonly defaultMenuItems: DropdownMenuItem[] = [
    {
      id: 'profile',
      label: 'My Profile',
      route: '/settings/profile',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    },
    {
      id: 'billing',
      label: 'Billing & Plans',
      route: '/settings/billing',
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
    },
    {
      id: 'security',
      label: 'Security',
      route: '/settings/security',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    },
    {
      id: 'home',
      label: 'Back to Home',
      route: '/home',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      dividerBefore: true
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
      isDanger: true
    }
  ];

  get activeMenuItems(): DropdownMenuItem[] {
    return this.menuItems.length > 0 ? this.menuItems : this.defaultMenuItems;
  }

  get fullName(): string {
    if (!this.user) return 'User';
    return `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim() || 'User';
  }

  get initials(): string {
    if (!this.user) return 'U';
    const first = this.user.firstName?.charAt(0) || '';
    const last = this.user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.isOpen.set(false);
  }

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  onItemClick(item: DropdownMenuItem): void {
    if (item.id === 'logout') {
      this.logout();
    } else if (item.action) {
      item.action();
      this.closeDropdown();
    } else if (item.route) {
      this.router.navigate([item.route]);
      this.closeDropdown();
    }
    this.menuItemClicked.emit(item.id);
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.loggedOut.emit();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.closeDropdown();
    }
  }
}
