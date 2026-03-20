import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/swiper/swiper').then(m => m.Swiper) },
  { path: 'destination/:id', loadComponent: () => import('./pages/detail/detail').then(m => m.Detail) },
  { path: 'admin/login', loadComponent: () => import('./pages/admin-login/admin-login').then(m => m.AdminLogin) },
  { path: 'admin', loadComponent: () => import('./pages/admin-list/admin-list').then(m => m.AdminList), canActivate: [authGuard] },
  { path: 'admin/nouveau', loadComponent: () => import('./pages/admin-form/admin-form').then(m => m.AdminForm), canActivate: [authGuard] },
  { path: 'admin/:id', loadComponent: () => import('./pages/admin-form/admin-form').then(m => m.AdminForm), canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
