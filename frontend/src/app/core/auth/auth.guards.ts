import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// There is no login page: while a guard waits, the navigation stays pending
// and the global login modal (shown when auth.loginRequired()) collects
// credentials. Logging in resolves the wait and the navigation completes.
//
// Note: inject() must run before the first `await`.

/** Allows the route once a user is logged in. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  await auth.whenAuthenticated();
  return true;
};

/** Tracker pages need a start date; send first-timers to onboarding. */
export const trackingStartedGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenAuthenticated();
  return auth.user()?.startDate ? true : router.parseUrl('/start');
};

/** Onboarding is only for users who haven't picked a start date. */
export const trackingNotStartedGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenAuthenticated();
  return auth.user()?.startDate ? router.parseUrl('/tracker') : true;
};
