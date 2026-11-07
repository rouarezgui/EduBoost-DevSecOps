import { ChangeDetectorRef, Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { AuthService } from '../../../core/services/auth';
import { ProgressApiService } from '../../../core/services/progress-api.service';
import { QuizApiService } from '../../../core/services/quiz-api.service';
import { CoursesApiService } from '../../../core/services/courses-api.service';
import { LearningApiService } from '../../../core/services/learning-api.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-student-progress',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-progress.html',
  styleUrls: ['./student-progress.css']
})
export class StudentProgressComponent implements OnInit {
  progressList: any[] = [];
  quizHistory: any[] = [];
  private summaryCourses: any[] = [];
  avgScore = 0;
  avgProgress = 0;
  completedCount = 0;
  loading = true;

  constructor(
    private cs: CourseService,
    private auth: AuthService,
    private progressApi: ProgressApiService,
    private quizApi: QuizApiService,
    private coursesApi: CoursesApiService,
    private learningApi: LearningApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Load quiz results from backend
    this.quizApi.getMyResults().pipe(catchError(() => of(null))).subscribe(results => {
      if (results && results.length > 0) {
        this.quizHistory = results.map((r: any) => ({
          course: r.course_title || r.course?.title || 'Cours',
          quiz: r.quiz_title || r.quiz?.title || 'Quiz',
          score: r.score || 0,
          total: r.total_questions || 0,
          date: r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '',
          passed: (r.score || 0) >= 50
        }));
        this.avgScore = Math.round(this.quizHistory.reduce((s, q) => s + q.score, 0) / this.quizHistory.length);
      }
      this.cdr.detectChanges();
    });

    this.learningApi.getSummary().pipe(catchError(() => of(null))).subscribe(summary => {
      this.summaryCourses = summary?.courses || [];
      this.avgProgress = summary?.avgProgress || 0;
      this.completedCount = summary?.completedCount || 0;
      if (!this.avgScore) this.avgScore = summary?.avgScore || 0;

      this.coursesApi.getCourses().pipe(catchError(() => of(null))).subscribe(apiCourses => {
        const courses = (apiCourses && apiCourses.length > 0) ? apiCourses : this.cs.list();
        this.buildProgressList(courses);
        this.loading = false;
        this.cdr.detectChanges();
      });
    });
  }

  buildProgressList(courses: any[]) {
    this.progressList = courses.map((c: any) => {
      const summary = this.summaryCourses.find((item: any) => item.id === c.id);
      const prog = Number(summary?.progress || 0);
      return {
        ...c,
        progress: prog,
        risk: summary?.risk || this.cs.calcRisk(prog),
        rec: summary?.rec || this.cs.recommendationFor(prog),
      };
    });
    if (this.progressList.length && !this.avgProgress) {
      this.avgProgress = Math.round(this.progressList.reduce((s, p) => s + p.progress, 0) / this.progressList.length);
    }
    if (!this.completedCount) this.completedCount = this.progressList.filter(p => p.progress >= 100).length;
  }

  getRiskColor(risk: string) { return risk === 'high' ? '#ef4444' : risk === 'medium' ? '#f59e0b' : '#10b981'; }
  getScoreColor(s: number) { return s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'; }
  goToCourse(id: number) { this.router.navigate(['/courses', id]); }
}
