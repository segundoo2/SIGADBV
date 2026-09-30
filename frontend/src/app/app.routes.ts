import { Routes } from '@angular/router';
import { authGuard } from './core/infra/guards/auth.guard';
import { guestGuard } from './core/infra/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./feature/auth/auth').then((m) => m.Auth),
  },
  {
    path: 'auth/update-password',
    loadComponent: () =>
      import('./feature/update-password/update-password').then(
        (m) => m.UpdatePassword,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'overview',
    loadComponent: () =>
      import('./feature/overview/overview').then((m) => m.Overview),
    canActivate: [authGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./feature/root-redirect').then(
        (m) => m.RootRedirect,
      ),
    pathMatch: 'full',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./feature/not-found-redirect').then(
        (m) => m.NotFoundRedirect,
      ),
  },
];
