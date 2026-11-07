import { Component, OnInit, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import { isPlatformBrowser, CommonModule, Location } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css']
})
export default class AdminLayoutComponent implements OnInit {
  userName = 'Admin';
  userEmail = '';
  userAvatar = 'AD';
  userRole = 'Administrator';
  sidebarOpen = true;
  profileMenuOpen = false;
  notifMenuOpen = false;
  breadcrumbs: {label: string; link?: string}[] = [];
  isDark = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private location: Location,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const saved = localStorage.getItem('eduboost_theme') || 'light';
    this.isDark = saved === 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    const user = this.auth.getCurrentUser();
    if (user) {
      this.userName   = user.name  || 'Admin';
      this.userEmail  = user.email || '';
      this.userAvatar = user.avatar ||
        (user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)) || 'AD';
    }

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.buildBreadcrumbs(e.url);
    });
    this.buildBreadcrumbs(this.router.url);
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    const theme = this.isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('eduboost_theme', theme);
    }
  }

  buildBreadcrumbs(url: string) {
    if      (url === '/admin')            this.breadcrumbs = [{ label: 'Dashboard' }];
    else if (url.includes('/admin/users'))   this.breadcrumbs = [{ label: 'Admin', link: '/admin' }, { label: 'Users' }];
    else if (url.includes('/admin/courses')) this.breadcrumbs = [{ label: 'Admin', link: '/admin' }, { label: 'Courses' }];
    // ✅ Admin profile breadcrumb
    else if (url.includes('/admin/profile')) this.breadcrumbs = [{ label: 'Admin', link: '/admin' }, { label: 'Profile' }];
    else if (url.includes('/admin/feedback')) this.breadcrumbs = [{ label: 'Admin', link: '/admin' }, { label: 'Feedback' }];
    else if (url.includes('/catalog'))       this.breadcrumbs = [{ label: 'Home', link: '/home' }, { label: 'Catalog' }];
    else if (url.includes('/chatbot'))       this.breadcrumbs = [{ label: 'Home', link: '/home' }, { label: 'Chatbot' }];
    else                                     this.breadcrumbs = [{ label: 'Admin', link: '/admin' }];
  }

  toggleSidebar()      { this.sidebarOpen = !this.sidebarOpen; }
  toggleProfileMenu(e: Event) { e.stopPropagation(); this.profileMenuOpen = !this.profileMenuOpen; this.notifMenuOpen = false; }
  toggleNotifMenu(e: Event)   { e.stopPropagation(); this.notifMenuOpen = !this.notifMenuOpen; this.profileMenuOpen = false; }

  @HostListener('document:click')
  closeMenus() { this.profileMenuOpen = false; this.notifMenuOpen = false; }

  navigateTo(link: string) {
    this.profileMenuOpen = false;
    this.router.navigate([link]);
  }

  // ✅ FIX: Admin profile goes to /admin/profile, NOT /dashboard/profile
  goToProfile() {
    this.profileMenuOpen = false;
    this.router.navigate(['/admin/profile']);
  }

  goBack()  { this.location.back(); }
  logout()  { this.profileMenuOpen = false; this.auth.logout(); }
}
