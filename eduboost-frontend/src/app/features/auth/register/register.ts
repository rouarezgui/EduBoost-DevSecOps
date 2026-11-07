import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  nameValue: string = '';
  emailValue: string = '';
  passwordValue: string = '';
  confirmPasswordValue: string = '';
  agreeTerms: boolean = false;
  showPassword: boolean = false;
  submitted: boolean = false;
  message: string = '';
  loading: boolean = false;

  constructor(private router: Router, private auth: AuthService) {}

  onRegister() {
   this.submitted = true;

if (!this.isFormValid()) {
      this.message = 'Veuillez corriger les erreurs ci-dessus.';
      return;
    }
    this.loading = true;
    this.message = '';

    // Try backend registration first
    this.auth.registerApi({
      username: this.nameValue.trim(),
      email: this.emailValue.trim().toLowerCase(),
      password: this.passwordValue
    }).subscribe({
      next: (res) => {
        this.loading = false;
        const created = res?.data || res || {};
        this.auth.setStudentApproval({
          id: created.id,
          email: this.emailValue.trim().toLowerCase()
        }, 'pending');
        const emailStatus = created.emailStatus || created.email || {};
        if (!emailStatus.sent && emailStatus.to && emailStatus.subject && emailStatus.body) {
          const href = `mailto:${emailStatus.to}?subject=${encodeURIComponent(emailStatus.subject)}&body=${encodeURIComponent(emailStatus.body)}`;
          window.location.href = href;
          this.message = '✅ Account created. Email app opened with the welcome message. Configure SMTP to send it automatically.';
        } else {
          this.message = '✅ Account created. Welcome! Please wait for admin approval before signing in.';
        }
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      //error: (err) => {
       // this.loading = false;
        // Fallback to local signup if backend unavailable
       // try {
        //  this.auth.signup(this.nameValue, this.emailValue, this.passwordValue);
        //  this.message = '✅ Inscription réussie! Bienvenue! 🎉';
       //   setTimeout(() => this.router.navigate(['/student/home']), 2000);
       // } catch (e: any) {
        //  this.message = '❌ ' + (err?.error?.detail || e?.message || 'Erreur lors de l\'inscription');
        //}
      //}
      error: (err) => {
      this.loading = false;
      console.error(err);
      this.message = '❌ ' + (err?.error?.detail || 'Registration failed. Please check backend.');
}
    });
  }

  isFormValid(): boolean {
    return (
      this.nameValue.length >= 3 &&
      this.isValidEmail(this.emailValue) &&
      this.isValidPassword(this.passwordValue) &&
      this.passwordValue === this.confirmPasswordValue &&
      this.agreeTerms
    );
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  }

  isValidPassword(password: string): boolean {
  return password.length >= 6;
}

  getPasswordStrength(): number {
    let strength = 0;
    const pwd = this.passwordValue;
    if (pwd.length >= 8) strength += 25;
    if (pwd.match(/[a-z]/)) strength += 25;
    if (pwd.match(/[A-Z]/)) strength += 25;
    if (pwd.match(/[0-9]/)) strength += 12.5;
    if (pwd.match(/[@$!%*?&]/)) strength += 12.5;
    return strength;
  }

  goToLogin() { this.router.navigate(['/login']); }
}
