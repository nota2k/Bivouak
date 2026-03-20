import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, catchError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

const API = 'http://localhost:3000/api';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);

  const token = auth.getToken();
  if (!token) {
    router.navigate(['/admin/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  return http.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).pipe(
    take(1),
    map(() => {
      auth.isAuthenticated.set(true);
      return true;
    }),
    catchError(() => {
      auth.logout();
      return of(false);
    })
  );
};
