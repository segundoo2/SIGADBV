import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./feature/auth/auth').then(m => m.Auth)
  },
  {
    path: 'auth/define-password',
    loadComponent: () => import('./feature/define-password/define-password').then(m => m.DefinePassword)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./feature/dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'auth'
  }
];