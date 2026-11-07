import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-dashboard-entry',
  standalone: true,
  imports: [CommonModule],
  template: ``
})
export default class DashboardEntryComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const user = this.auth.getCurrentUser();
    if (user && user.role === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/student/home']);
    }
  }
}
