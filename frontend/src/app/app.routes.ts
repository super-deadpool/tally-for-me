import type { Routes } from '@angular/router';
import { trackingNotStartedGuard, trackingStartedGuard } from './core/auth/auth.guards';

// Every page needs a session. The guards wait for login (via the global login
// modal) rather than redirecting, since there is no login page.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tracker' },
  {
    path: 'tracker',
    title: 'Tracker',
    canActivate: [trackingStartedGuard],
    loadComponent: () =>
      import('./features/tracker/tracker-page.component').then((m) => m.TrackerPageComponent),
  },
  {
    path: 'start',
    title: 'Get started',
    canActivate: [trackingNotStartedGuard],
    loadComponent: () =>
      import('./features/onboarding/start-page.component').then((m) => m.StartPageComponent),
  },
  { path: '**', redirectTo: 'tracker' },
];
