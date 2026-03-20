import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

const API = 'http://localhost:3000/api';

export interface LoginResponse {
  token: string;
  user: { id: number; email: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenKey = 'bivouak_token';

  isAuthenticated = signal(false);

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${API}/auth/login`, { email, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.tokenKey, res.token);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.isAuthenticated.set(false);
    this.router.navigate(['/admin/login']);
  }

}
