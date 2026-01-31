import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // User is not authenticated, redirect to login
  // Only set returnUrl if not already trying to access login page to prevent loops
  const currentUrl = state.url;
  if (currentUrl.startsWith('/auth/login')) {
    // Already going to login, don't set returnUrl to prevent infinite loop
    await router.navigate(['/auth/login']);
  } else {
    // Extract only the pathname without query params to prevent recursive encoding
    const urlPath = currentUrl.split('?')[0];
    await router.navigate(['/auth/login'], { queryParams: { returnUrl: urlPath } });
  }
  return false;
};
