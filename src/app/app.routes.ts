import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/swiper/swiper').then(m => m.Swiper) },
  { path: 'destination/:id', loadComponent: () => import('./pages/detail/detail').then(m => m.Detail) },
  { path: 'admin', loadComponent: () => import('./pages/admin-list/admin-list').then(m => m.AdminList) },
  { path: 'admin/nouveau', loadComponent: () => import('./pages/admin-form/admin-form').then(m => m.AdminForm) },
  { path: '**', redirectTo: '' }
];
