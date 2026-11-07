import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-student-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-settings.html',
  styleUrls: ['./student-settings.css']
})
export class StudentSettingsComponent implements OnInit {
  toast = ''; toastType = 'success'; toastTimer: any;
  showDeleteConfirm = false;
  activeSection: 'notifications' | 'privacy' | 'preferences' | 'password' | 'data' = 'notifications';

  prefs = {
    emailNotifs:    true,
    progressAlerts: true,
    quizReminders:  false,
    newsletter:     false,
    language:       'English',
    theme:          'dark',
    videoQuality:   'auto',
    subtitles:      'off',
  };

  privacy = {
    profilePublic: true,
    showProgress:  true,
    allowMessages: false,
  };

  // Update password form
  pwForm = { current: '', newPw: '', confirm: '' };
  pwError = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const saved = localStorage.getItem('student_prefs');
    if (saved) { try { this.prefs = { ...this.prefs, ...JSON.parse(saved) }; } catch {} }
    const savedPv = localStorage.getItem('student_privacy');
    if (savedPv) { try { this.privacy = { ...this.privacy, ...JSON.parse(savedPv) }; } catch {} }
    // Apply saved theme on load
    this.applyTheme(this.prefs.theme);
  }

  applyTheme(theme: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }

  applyLanguage(lang: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('app_language', lang);
  }

  saveNotifications() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('student_prefs', JSON.stringify(this.prefs));
    }
    this.showToast('Notification preferences saved!', 'success');
    this.auth.addNotification('Notification settings updated', 'green');
  }

  savePrivacy() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('student_privacy', JSON.stringify(this.privacy));
    }
    this.showToast('Privacy settings saved!', 'success');
  }

  savePrefs() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('student_prefs', JSON.stringify(this.prefs));
    }
    this.applyTheme(this.prefs.theme);
    this.applyLanguage(this.prefs.language);
    this.showToast('Preferences saved!', 'success');
  }

  // ── Update Password ──
  changePassword() {
    this.pwError = '';
    const user = this.auth.getCurrentUser();
    if (!user) { this.pwError = 'User not found.'; return; }
    if (!this.pwForm.current) { this.pwError = 'Enter your current password.'; return; }
    if (this.pwForm.current !== user.password) { this.pwError = 'Current password is incorrect.'; return; }
    if (this.pwForm.newPw.length < 4) { this.pwError = 'New password must be at least 4 characters.'; return; }
    if (this.pwForm.newPw !== this.pwForm.confirm) { this.pwError = 'Passwords do not match.'; return; }
    this.auth.updateUser(user.id, { password: this.pwForm.newPw });
    // Update stored user
    if (isPlatformBrowser(this.platformId)) {
      const updated = { ...user, password: this.pwForm.newPw };
      localStorage.setItem('user', JSON.stringify(updated));
    }
    this.pwForm = { current: '', newPw: '', confirm: '' };
    this.showToast('Password updated successfully!', 'success');
  }

  exportData() {
    if (!isPlatformBrowser(this.platformId)) return;
    const user = this.auth.getCurrentUser();
    const data = { user, prefs: this.prefs, privacy: this.privacy, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'eduboost-data.json'; a.click();
    URL.revokeObjectURL(url);
    this.showToast('Data exported!', 'info');
  }

  confirmDelete() { this.showDeleteConfirm = true; }
  cancelDelete()  { this.showDeleteConfirm = false; }

  deleteAccount() {
    this.showDeleteConfirm = false;
    const user = this.auth.getCurrentUser();
    if (user) this.auth.deleteUser(user.id);
    this.showToast('Account deleted. Signing out…', 'danger');
    setTimeout(() => this.auth.logout(), 2500);
  }

  showToast(msg: string, type = 'success') {
    clearTimeout(this.toastTimer);
    this.toast = msg; this.toastType = type;
    this.toastTimer = setTimeout(() => this.toast = '', 3500);
  }
}
