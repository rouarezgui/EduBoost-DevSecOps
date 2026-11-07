import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {
  emailValue: string = '';  // Changé de 'email' à 'emailValue'
  message = '';
  loading = false;
  submitted = false;

  constructor(private router: Router, private auth: AuthService) {}

  onSubmit() {
    this.submitted = true;
    
    if (!this.emailValue) {
      this.message = '❌ Please enter your email';
      return;
    }
    
    if (!this.isValidEmail(this.emailValue)) {
      this.message = '❌ Please enter a valid email address';
      return;
    }
    
    this.loading = true;
    this.message = '';
    
    this.auth.forgotPassword(this.emailValue)
      .pipe(catchError(err => {
        this.loading = false;
        this.message = err?.error?.detail || '❌ Could not send reset email';
        return of(null);
      }))
      .subscribe((res: any) => {
        if (!res) return;
        this.loading = false;
        const data = res.data || res;
        if (data.sent) {
          this.message = '✅ Reset link sent! Check your email.';
        } else {
          this.message = '✅ Reset request created. Configure SMTP to send email automatically.';
          if (data.email && data.subject && data.body) {
            const href = `mailto:${data.email}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
            window.open(href, '_blank');
          }
        }

        setTimeout(() => this.router.navigate(['/login']), 2500);
      });
  }

  isValidEmail(email: string): boolean {
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    return emailPattern.test(email);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
