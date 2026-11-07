import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password';
import { RoleGuard } from './core/guards/role.guard';
import { Index } from './mentor/index/index';
import { About } from './mentor/about/about';
import { Courses } from './mentor/courses/courses';
import { Pricing } from './mentor/pricing/pricing';
import { Contact } from './mentor/contact/contact';

export const routes: Routes = [
  // Default redirect to Home
  { path: '', redirectTo: '/Home', pathMatch: 'full' },

  // Public pages (mentor site)
  { path: 'Home', component: Index },
  { path: 'about', component: About },
  { path: 'mentor/courses', component: Courses },
  { path: 'mentor/pricing', component: Pricing },
  { path: 'mentor/contact', component: Contact },

  // Auth
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  // Student dashboard
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard-entry').then(m => m.default)
  },
  { path: 'dashboard/user',          redirectTo: '/student/home', pathMatch: 'full' },
  { path: 'dashboard/user-redirect', redirectTo: '/student/home', pathMatch: 'full' },
  { path: 'dashboard/courses',  redirectTo: '/student/courses',  pathMatch: 'full' },
  { path: 'dashboard/profile',  redirectTo: '/student/profile',  pathMatch: 'full' },
  { path: 'dashboard/settings', redirectTo: '/student/profile', pathMatch: 'full' },

  {
    path: 'student',
    loadComponent: () => import('./features/dashboard/student-layout/student-layout').then(m => m.default),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home',     loadComponent: () => import('./features/dashboard/student-home/student-home').then(m => m.StudentHomeComponent) },
      { path: 'courses',  loadComponent: () => import('./features/dashboard/student-courses/student-courses').then(m => m.StudentCoursesComponent) },
      { path: 'progress', loadComponent: () => import('./features/dashboard/student-progress/student-progress').then(m => m.StudentProgressComponent) },
      { path: 'profile',  loadComponent: () => import('./features/dashboard/student-profile/student-profile').then(m => m.StudentProfileComponent) },
      { path: 'settings', redirectTo: 'profile', pathMatch: 'full' },
    ]
  },

  // Admin dashboard
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-layout').then(m => m.default),
    canActivate: [RoleGuard],
    children: [
      { path: '',        loadComponent: () => import('./features/admin/admin-dash').then(m => m.default) },
      { path: 'courses', loadComponent: () => import('./features/admin/courses/admin-courses').then(m => m.AdminCoursesComponent) },
      { path: 'users',   loadComponent: () => import('./features/admin/users/users').then(m => m.AdminUsersComponent) },
      { path: 'feedback', loadComponent: () => import('./features/admin/feedback/admin-feedback').then(m => m.AdminFeedbackComponent) },
      { path: 'profile', loadComponent: () => import('./features/admin/admin-profile/admin-profile').then(m => m.AdminProfileComponent) },
      { path: 'settings', redirectTo: '/admin/profile', pathMatch: 'full' },
    ]
  },

  // Courses
  { path: 'catalog',     loadComponent: () => import('./features/courses/course-list/course-list').then(m => m.CourseListComponent) },
  { path: 'courses/:id', loadComponent: () => import('./features/courses/course-detail/course-detail').then(m => m.CourseDetailComponent) },

  // Quiz route
  {
    path: 'courses/:courseId/quizzes/:quizId',
    loadComponent: () => import('./features/quiz/quiz').then(m => m.QuizComponent)
  },

  // Chapter / Start Learning route
  {
    path: 'courses/:courseId/chapters/:chapterId',
    loadComponent: () => import('./features/courses/chapter/chapter').then(m => m.ChapterComponent)
  },

  // Chatbot
  { path: 'chatbot', loadComponent: () => import('./features/chatbot/chatbot').then(m => m.ChatbotComponent) },

  // Access denied
  { path: 'access-denied', loadComponent: () => import('./features/shared/access-denied/access-denied').then(m => m.AccessDeniedComponent) },

  { path: '**', redirectTo: '/Home' }
];
