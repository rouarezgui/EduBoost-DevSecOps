import { Component, OnInit, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth';
import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, FormsModule],
  templateUrl: './student-layout.html',
  styleUrls: ['./student-layout.css']
})
export default class StudentLayoutComponent implements OnInit {
  userName    = 'Student';
  userAvatar  = 'ST';
  totalCourses = 0;

  // Topbar
  pageTitle    = 'Dashboard';
  pageSubtitle = 'Welcome back!';
  searchQuery  = '';
  notifOpen    = false;
  notifications: any[] = [];
  unreadCount  = 0;

  // Toast
  toast     = '';
  toastType = 'success';
  toastTimer: any;

  private routeTitles: Record<string, { title: string; sub: string }> = {
    'home':     { title: 'Dashboard',    sub: 'Your learning overview' },
    'courses':  { title: 'My Courses',   sub: 'Track your enrolled courses' },
    'progress': { title: 'My Progress',  sub: 'Monitor your learning journey' },
    'catalog':  { title: 'Course Catalog', sub: 'Explore all available courses' },
    'chatbot':  { title: 'AI Assistant', sub: 'Get personalized help' },
    'profile':  { title: 'My Profile',   sub: 'Manage your account' },
  };

  constructor(
    private auth: AuthService,
    private cs: CourseService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const user = this.auth.getCurrentUser();
    if (user) {
      this.userName   = user.name || 'Student';
      this.userAvatar = user.avatar || user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) || 'ST';
    }
    this.totalCourses = this.cs.list().length;
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.updatePageMeta(e.url);
      this.notifOpen = false;
    });
    this.updatePageMeta(this.router.url);
  }

  updatePageMeta(url: string) {
    const key = Object.keys(this.routeTitles).find(k => url.includes('student-' + k)) ||
                Object.keys(this.routeTitles).find(k => url.endsWith('/user')) ? 'home' :
                Object.keys(this.routeTitles).find(k => url.includes(k)) || 'home';
    const meta = this.routeTitles[key] || this.routeTitles['home'];
    this.pageTitle    = meta.title;
    this.pageSubtitle = meta.sub;
  }

  loadNotifs() {
    this.notifications = this.auth.getNotifications();
    this.unreadCount   = this.auth.getUnreadCount();
  }

  markAllRead() { this.auth.markAllNotificationsRead(); this.loadNotifs(); }

  toggleNotif(e: Event) { e.stopPropagation(); this.notifOpen = !this.notifOpen; }

  @HostListener('document:click')
  closeDrops() { this.notifOpen = false; }

  isActive(key: string): boolean {
    const url = this.router.url;
    if (key === 'home')     return url.includes('/student/home') || url.includes('/dashboard/user');
    if (key === 'catalog')  return url.includes('/catalog');
    if (key === 'chatbot')  return url.includes('/chatbot');
    return url.includes('student-' + key);
  }

  navigate(key: string) {
    const routeMap: Record<string, string> = {
      home:     '/dashboard/user',
      courses:  '/student/courses',
      progress: '/student/progress',
      catalog:  '/catalog',
      chatbot:  '/chatbot',
      profile:  '/student/profile',
    };
    if (key === 'chatbot' && isPlatformBrowser(this.platformId)) {
      window.location.href = 'http://127.0.0.1:8000/assistant/';
      return;
    }
    this.router.navigate([routeMap[key] || '/dashboard/user']);
  }

  doSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/catalog'], { queryParams: { q: this.searchQuery } });
    }
  }

  showToast(msg: string, type: 'success'|'info'|'warning'|'danger' = 'success') {
    clearTimeout(this.toastTimer);
    this.toast     = msg;
    this.toastType = type;
    this.toastTimer = setTimeout(() => this.toast = '', 3500);
  }

  logout() {
    this.showToast('Signed out successfully. See you soon!', 'info');
    setTimeout(() => this.auth.logout(), 1000);
  }
}
