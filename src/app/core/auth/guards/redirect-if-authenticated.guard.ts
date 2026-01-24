import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Guard that redirects authenticated users to the dashboard.
 * Use this on public pages like landing page, login, signup etc.
 * to prevent logged-in users from accessing these pages.
 */
export const redirectIfAuthenticatedGuard: CanActivateFn = async (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // User is authenticated, redirect to dashboard
    await router.navigate(['/dashboard']);
    return false;
  }

  // User is not authenticated, allow access to the page
  return true;
};
