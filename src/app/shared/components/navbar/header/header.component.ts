import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../features/auth/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.css']
})
export class HeaderComponent {
  private router = inject(Router);
  authService = inject(AuthService);

  isScrolled = false;
  mobileMenuOpen = false;
  userMenuOpen = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.isScrolled = window.scrollY > 50;
      });

      // Close user menu when clicking outside
      document.addEventListener('click', (event) => {
        if (!event.target || !(event.target as Element).closest('.relative')) {
          this.userMenuOpen = false;
        }
      });
    }
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  navigateToLogin(): void {
    this.closeMobileMenu();
    this.router.navigate(['/login']);
  }

  navigateToSignup(): void {
    this.closeMobileMenu();
    this.router.navigate(['/signup']);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
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
    this.userMenuOpen = false;
    this.closeMobileMenu();
    this.authService.logout()
      .then(() => this.router.navigate(['/']))
      .then(() => {
        // Optionally handle post-navigation actions here
        })
      .catch(err => {
        console.error('Logout/navigation failed', err);
      });
  }

  getPlanBadgeClasses(plan: string): string {
    const classes = {
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    return classes[plan as keyof typeof classes] || classes.free;
  }

  getPlanLabel(plan: string): string {
    const labels: { [key: string]: string } = {
      free: 'Free',
      pro: 'Pro',
      enterprise: 'Enterprise'
    };
    return labels[plan] || 'Free';
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }
}
