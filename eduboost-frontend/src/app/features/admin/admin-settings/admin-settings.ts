import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';

type Section = 'platform' | 'notifications' | 'appearance' | 'security';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.html',
  styleUrls: ['./admin-settings.css']
})
export class AdminSettingsComponent implements OnInit {
  toast = ''; toastType = 'success'; toastTimer: any;
  activeSection: Section = 'platform';

  // ✅ FIX: key typed as Section, not string
  sections: { key: Section; label: string }[] = [
    { key: 'platform',      label: 'Platform'       },
    { key: 'notifications', label: 'Notifications'  },
    { key: 'appearance',    label: 'Appearance'      },
    { key: 'security',      label: 'Security'        },
  ];

  platform = {
    maintenance:        false,
    allowRegistrations: true,
    emailVerification:  true,
    twoFactor:          false,
    analytics:          true,
  };

  notifs = {
    systemAlerts:  true,
    newUsers:      true,
    courseUpdates: false,
    weeklyReports: true,
  };

  appearance = {
    language:    'English',
    theme:       'dark',
    layout:      'cards',
    rowsPerPage: '20',
  };

  security = {
    forceHttps:     true,
    sessionTimeout: true,
    rateLimiting:   true,
    auditLog:       false,
  };

  constructor(
    private auth: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const s = localStorage.getItem('admin_settings');
    if (s) {
      try {
        const p = JSON.parse(s);
        if (p.platform)   this.platform   = { ...this.platform,   ...p.platform };
        if (p.notifs)     this.notifs     = { ...this.notifs,     ...p.notifs };
        if (p.appearance) this.appearance = { ...this.appearance, ...p.appearance };
        if (p.security)   this.security   = { ...this.security,   ...p.security };
      } catch {}
    }
  }

  private persist() {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('admin_settings', JSON.stringify({
      platform: this.platform, notifs: this.notifs,
      appearance: this.appearance, security: this.security,
    }));
  }

  savePlatform()   { this.persist(); this.showToast('Platform settings saved!');    }
  saveNotifs()     { this.persist(); this.showToast('Notification settings saved!'); }
  saveAppearance() { this.persist(); this.showToast('Appearance saved!');            }
  saveSecurity()   { this.persist(); this.showToast('Security settings saved!');     }

  showToast(msg: string, type = 'success') {
    clearTimeout(this.toastTimer);
    this.toast = msg; this.toastType = type;
    this.toastTimer = setTimeout(() => this.toast = '', 3500);
  }
}