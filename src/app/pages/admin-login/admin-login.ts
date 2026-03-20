import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss',
})
export class AdminLogin {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  error = '';
  loading = false;

  onSubmit() {
    this.error = '';
    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.error = err.error?.error || err.message || 'Identifiants incorrects';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
