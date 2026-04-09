import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AuthGuard checking route:', state.url);
  if (authService.isLoggedIn()) {
    console.log('AuthGuard: Access granted');
    return true;
  }

  console.warn('AuthGuard: Access denied, redirecting to login');
  // Redirect to login page if not logged in
  router.navigate(['/login']);
  return false;
};
