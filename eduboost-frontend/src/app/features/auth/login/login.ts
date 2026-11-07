import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email = '';
  password = '';
  message = '';
  showPassword = false;
  loading = false;
  private returnUrl = '/student/home';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    const q = this.route.snapshot.queryParams['returnUrl'];
    if (q) this.returnUrl = q;
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.message = '❌ Veuillez remplir tous les champs';
      return;
    }
    this.loading = true;
    this.message = '';

    // Try real backend first
    this.auth.loginApi(this.email, this.password).subscribe({
      next: (res) => {
        // Fetch user info after login
        this.auth.fetchCurrentUser().subscribe({
          next: (user) => {
            this.loading = false;
            if (user) {
              // Store normalized user
             const normalized = {
                id: user.id,
                name: user.username || user.email,
                email: user.email,
                role: user.type,
                avatar: (user.username || user.email).substring(0, 2).toUpperCase()
              };
              if (isPlatformBrowser(this.platformId)) {
                localStorage.setItem('user', JSON.stringify(normalized));
              }
              const role = normalized.role;
              if (role === 'admin') {
                this.router.navigateByUrl('/admin');
              } else {
                this.auth.fetchMyApproval().pipe(catchError(() => of(null))).subscribe(approval => {
                  const status = approval?.data?.approvalStatus || approval?.approvalStatus || this.auth.getStudentApprovalStatus(normalized);
                  if (status !== 'approved') {
                    this.auth.clearSession();
                    this.message = status === 'rejected'
                      ? '❌ Your account request was rejected by the admin.'
                      : '⏳ Your account is waiting for admin approval.';
                    return;
                  }
                  this.auth.setStudentApproval(normalized, 'approved');
                  this.router.navigateByUrl(this.studentTargetUrl());
                });
              }
            }
          },
          error: () => {
            this.loading = false;
            this.router.navigateByUrl(this.studentTargetUrl());
          }
        });
      },
      error: (err) => {
        this.loading = false;
        // Fallback to local auth if backend is down
        const ok = this.auth.login(this.email, this.password);
        if (ok) {
          const user = this.auth.getCurrentUser();
          if (user?.role === 'admin') {
            this.router.navigateByUrl('/admin');
          } else {
            const status = this.auth.getStudentApprovalStatus(user);
            if (status !== 'approved') {
              this.auth.clearSession();
              this.message = status === 'rejected'
                ? '❌ Your account request was rejected by the admin.'
                : '⏳ Your account is waiting for admin approval.';
              return;
            }
            this.router.navigateByUrl(this.studentTargetUrl());
          }
        } else {
          this.message = '❌ Email ou mot de passe incorrect';
        }
      }
    });
  }

  private studentTargetUrl(): string {
    const target = this.returnUrl || '/student/home';
    if (target.startsWith('/student') || target.startsWith('/dashboard/user') || target.startsWith('/catalog') || target.startsWith('/courses')) {
      return target;
    }
    return '/student/home';
  }
}
