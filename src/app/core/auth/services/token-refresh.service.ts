import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private refreshTimerId: ReturnType<typeof setTimeout> | null = null;
  private readonly REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

  /**
   * Start monitoring the access token and schedule refresh before expiry
   */
  startTokenRefreshTimer(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.clearRefreshTimer();
    this.scheduleTokenRefresh();
  }

  /**
   * Stop the token refresh timer
   */
  stopTokenRefreshTimer(): void {
    this.clearRefreshTimer();
  }

  /**
   * Schedule the next token refresh based on token expiration
   */
  private scheduleTokenRefresh(): void {
    const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

    if (!accessToken) {
      return;
    }

    const expirationTime = this.getTokenExpirationTime(accessToken);

    if (!expirationTime) {
      return;
    }

    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    // Calculate when to refresh (5 minutes before expiry)
    const refreshIn = Math.max(timeUntilExpiry - this.REFRESH_BUFFER_MS, 0);

    if (refreshIn <= 0) {
      // Token is already expired or about to expire, refresh immediately
      this.performTokenRefresh();
    } else {
      // Schedule refresh
      this.refreshTimerId = setTimeout(() => {
        this.performTokenRefresh();
      }, refreshIn);

      console.log(`Token refresh scheduled in ${Math.round(refreshIn / 1000 / 60)} minutes`);
    }
  }

  /**
   * Perform the token refresh
   */
  private async performTokenRefresh(): Promise<void> {
    try {
      await this.authService.refreshToken();
      console.log('Token refreshed successfully');

      // Schedule the next refresh
      this.scheduleTokenRefresh();
    } catch (error) {
      console.error('Token refresh failed:', error);

      // Clear tokens and redirect to login
      await this.authService.logout();

      // Only capture returnUrl if not already on the login page
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/auth/login')) {
        await this.router.navigate(['/auth/login'], {
          queryParams: {
            sessionExpired: 'true',
            returnUrl: currentPath
          }
        });
      } else {
        // Already on login page, just navigate without returnUrl to break the loop
        await this.router.navigate(['/auth/login'], {
          queryParams: {
            sessionExpired: 'true'
          }
        });
      }
    }
  }

  /**
   * Get the expiration time from a JWT token
   */
  private getTokenExpirationTime(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // exp is in seconds, convert to milliseconds
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear the refresh timer
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }

  ngOnDestroy(): void {
    this.clearRefreshTimer();
  }
}

