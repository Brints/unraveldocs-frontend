import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { Logo } from '../../logo/logo';
import { ProfileDropdownComponent } from '../../profile-dropdown/profile-dropdown.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, Logo, ProfileDropdownComponent],
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.css']
})
export class HeaderComponent {
  private router = inject(Router);
  authService = inject(AuthService);

  isScrolled = false;
  mobileMenuOpen = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.isScrolled = window.scrollY > 50;
      });
    }
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  async navigateToLogin(): Promise<void> {
    this.closeMobileMenu();
    await this.router.navigate(['/auth/login']);
  }

  async navigateToSignup(): Promise<void> {
    this.closeMobileMenu();
    await this.router.navigate(['/auth/signup']);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  scrollToSection(sectionId: string): void {
    if (typeof document !== 'undefined') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  logout(): void {
    this.closeMobileMenu();
    this.authService.logout()
      .then(() => this.router.navigate(['/']))
      .catch(err => {
        console.error('Logout failed', err);
      });
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  getUserFullName(user: any): string {
    if (!user) return 'User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
  }

  getUserAvatar(user: any): string {
    return user?.profilePicture || 'assets/default-avatar.png';
  }
}
