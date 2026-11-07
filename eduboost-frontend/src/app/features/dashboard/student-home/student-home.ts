import { ChangeDetectorRef, Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { CourseService } from '../../../core/services/course.service';
import { StudentApiService } from '../../../core/services/student-api.service';
import { CoursesApiService } from '../../../core/services/courses-api.service';
import { LearningApiService } from '../../../core/services/learning-api.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-student-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-home.html',
  styleUrls: ['./student-home.css']
})
export class StudentHomeComponent implements OnInit {
  user: any = null;
  greeting = 'Good morning';
  courses: any[] = [];
  progressList: any[] = [];
  recommendations: any[] = [];

  stats = [
    { label: 'Enrolled Courses', value: 0,    icon: 'book',    color: 'indigo', sub: '' },
    { label: 'Completed',        value: 0,    icon: 'check',   color: 'green',  sub: '' },
    { label: 'Quizzes Passed',   value: 0,    icon: 'quiz',    color: 'cyan',   sub: '' },
  ];

  recentActivity: any[] = [];
  continueCourses: any[] = [];
  dashboardData: any = null;
  learningSummary: any = null;
  loading = true;

  constructor(
    private auth: AuthService,
    private cs: CourseService,
    private studentApi: StudentApiService,
    private coursesApi: CoursesApiService,
    private learningApi: LearningApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.user = this.auth.getCurrentUser();
    const h = new Date().getHours();
    this.greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';

    // Try to get dashboard from backend
    this.studentApi.getDashboard().pipe(
      catchError(() => of(null))
    ).subscribe(dashboard => {
      if (dashboard) {
        this.dashboardData = dashboard;
        this.loadFromDashboard(dashboard);
      } else {
        this.loadFromLocal();
      }
      this.loading = false;
      this.cdr.detectChanges();
    });

    // Load courses from backend
    this.coursesApi.getCourses().pipe(
      catchError(() => of(null))
    ).subscribe(apiCourses => {
      if (apiCourses && apiCourses.length > 0) {
        this.courses = apiCourses;
        this.buildProgressList(apiCourses);
      } else {
        this.courses = this.cs.list();
        this.buildProgressList(this.courses);
      }
      this.cdr.detectChanges();
    });

    this.learningApi.getSummary().pipe(catchError(() => of(null))).subscribe(summary => {
      if (!summary) return;
      this.learningSummary = summary;
      this.applyLearningSummary(summary);
      if (this.courses.length) this.buildProgressList(this.courses);
      this.cdr.detectChanges();
    });
  }

  loadFromDashboard(dashboard: any) {
    if (dashboard.enrolled_courses !== undefined) {
      this.stats[0].value = dashboard.enrolled_courses || 0;
      this.stats[0].sub = `${dashboard.enrolled_courses} cours inscrits`;
    }
    if (dashboard.completed_courses !== undefined) {
      this.stats[1].value = dashboard.completed_courses || 0;
    }
    if (dashboard.quizzes_passed !== undefined) {
      this.stats[2].value = dashboard.quizzes_passed || 0;
    }
    if (dashboard.recent_activities) {
      this.recentActivity = dashboard.recent_activities.slice(0, 5).map((a: any) => ({
        label: a.description || a.activity || a.text,
        detail: a.detail || '',
        time: a.created_at || a.time || '',
        icon: a.type === 'quiz' ? 'quiz' : 'book',
        color: 'indigo'
      }));
    }
  }

  loadFromLocal() {
    this.courses = this.cs.list();
    if (this.user) {
      const attempts = this.cs.getAttemptsForUser(this.user.id);
      const passed = attempts.filter((a: any) => a.score >= 50).length;
      this.stats[0].value = this.courses.length;
      this.stats[0].sub = `${this.courses.length} cours total`;
      this.stats[2].value = passed;
      this.stats[2].sub = attempts.length ? `Score moyen ${Math.round(attempts.reduce((s: number, a: any) => s + a.score, 0) / attempts.length)}%` : 'Aucun quiz';
      const notifs = this.auth.getNotifications ? this.auth.getNotifications() : [];
      this.recentActivity = notifs.slice(0, 5).map((n: any) => ({
        label: n.text,
        detail: n.detail || '',
        time: n.time || '',
        icon: n.type === 'quiz' ? 'quiz' : 'book',
        color: n.color || 'indigo'
      }));
    }
  }

  buildProgressList(courses: any[]) {
    const summaryCourses = this.learningSummary?.courses || [];
    this.progressList = courses.slice(0, 6).map((c) => {
      const summary = summaryCourses.find((item: any) => item.id === c.id);
      const prog = Number(summary?.progress || 0);
      return {
        course: c,
        progress: prog,
        chapters: c.chapters?.length || 0,
        quizzes: c.quizzes?.length || 0,
        risk: summary?.risk || this.cs.calcRisk(prog),
        rec: summary?.rec || this.cs.recommendationFor(prog),
      };
    });
    this.continueCourses = this.progressList.filter(p => p.progress > 0 && p.progress < 100).slice(0, 3);
    this.recommendations = this.progressList.filter(p => p.progress < 80).map(p => ({ course: p.course, rec: p.rec, risk: p.risk })).slice(0, 3);
    this.stats[1].value = this.progressList.filter(p => p.progress === 100).length;
  }

  private applyLearningSummary(summary: any) {
    this.stats[0].value = summary.totalCourses || 0;
    this.stats[0].sub = `${summary.totalCourses || 0} cours inscrits`;
    this.stats[1].value = summary.completedCount || 0;
    this.stats[2].value = summary.quizzesPassed || 0;
    this.stats[2].sub = summary.avgScore ? `Score moyen ${summary.avgScore}%` : 'Aucun quiz';
    this.recentActivity = (summary.recentActivity || []).slice(0, 5).map((item: any) => ({
      label: item.action === 'quiz_submit' ? 'Quiz completed' : item.action === 'chapter_view' ? 'Chapter read' : 'Course activity',
      detail: item.course_title || '',
      time: item.time ? new Date(item.time).toLocaleDateString('fr-FR') : '',
      icon: item.action === 'quiz_submit' ? 'quiz' : 'book',
      color: 'indigo'
    }));
  }

  getRiskColor(risk: string) {
    return risk === 'high' ? 'var(--a6)' : risk === 'medium' ? 'var(--a5)' : 'var(--a4)';
  }

  goToCourse(id: number) { this.router.navigate(['/courses', id]); }
  goToProgress() { this.router.navigate(['/student/progress']); }
  goToCatalog() { this.router.navigate(['/catalog']); }
  goToCourses() { this.router.navigate(['/student/courses']); }
}
