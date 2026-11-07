import { ChangeDetectorRef, Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { CourseService } from '../../../core/services/course.service';
import { StudentApiService } from '../../../core/services/student-api.service';
import { CoursesApiService } from '../../../core/services/courses-api.service';
import { LearningApiService } from '../../../core/services/learning-api.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './student-courses.html',
  styleUrls: ['./student-courses.css']
})
export class StudentCoursesComponent implements OnInit {
  courses: any[] = [];
  filtered: any[] = [];
  search = '';
  filterLevel = 'all';
  toast = ''; toastType = 'success'; toastTimer: any;
  levels = ['all', 'Beginner', 'Intermediate', 'Advanced'];
  loading = true;

  private summaryCourses: any[] = [];

  constructor(
    private cs: CourseService,
    private auth: AuthService,
    private studentApi: StudentApiService,
    private coursesApi: CoursesApiService,
    private learningApi: LearningApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.learningApi.getSummary().pipe(catchError(() => of(null))).subscribe(summary => {
      this.summaryCourses = summary?.courses || [];
      if (this.courses.length) {
        this.applyBackendProgress();
        this.applyFilter();
        this.cdr.detectChanges();
      }
    });

    // Try to get enrolled courses from backend
    this.studentApi.getMyCourses().pipe(
      catchError(() => of(null))
    ).subscribe(apiCourses => {
      if (apiCourses && apiCourses.length > 0) {
        this.courses = apiCourses.map((c: any, i: number) => ({
          ...c,
          progress: 0,
          enrolled: true,
        }));
        this.applyBackendProgress();
      } else {
        // Fallback: get all courses from backend or local
        this.coursesApi.getCourses().pipe(
          catchError(() => of(null))
        ).subscribe(allCourses => {
          const src = (allCourses && allCourses.length > 0) ? allCourses : this.cs.list();
          this.courses = src.map((c: any) => ({
            ...c,
            progress: 0,
            enrolled: true,
          }));
          this.applyBackendProgress();
          this.loading = false;
          this.applyFilter();
          this.cdr.detectChanges();
        });
        return;
      }
      this.loading = false;
      this.applyFilter();
      this.cdr.detectChanges();
    });
  }

  private applyBackendProgress() {
    this.courses = this.courses.map((course: any) => {
      const summary = this.summaryCourses.find((item: any) => item.id === course.id);
      return {
        ...course,
        progress: Number(summary?.progress || 0),
        risk: summary?.risk,
        rec: summary?.rec,
      };
    });
  }

  applyFilter() {
    this.filtered = this.courses.filter(c => {
      const matchSearch = !this.search || c.title.toLowerCase().includes(this.search.toLowerCase());
      const matchLevel = this.filterLevel === 'all' || c.difficulty === this.filterLevel;
      return matchSearch && matchLevel;
    });
  }

  getLevelClass(level: string) {
    if (level === 'Intermediate') return 'lv-blue';
    if (level === 'Advanced') return 'lv-orange';
    return 'lv-green';
  }

  getStatusLabel(p: number) { return p === 0 ? 'Not started' : p === 100 ? 'Completed' : 'In progress'; }
  getStatusClass(p: number) { return p === 0 ? 'st-new' : p === 100 ? 'st-done' : 'st-progress'; }

  viewCourse(id: number) { this.router.navigate(['/courses', id]); }

  showToast(msg: string, type = 'success') {
    clearTimeout(this.toastTimer);
    this.toast = msg; this.toastType = type;
    this.toastTimer = setTimeout(() => this.toast = '', 3200);
  }

  resumeCourse(c: any) {
    if (c.chapters?.length) {
      this.router.navigate(['/courses', c.id, 'chapters', c.chapters[0].id]);
    } else {
      this.viewCourse(c.id);
    }
    this.showToast(`Reprise de "${c.title}"`, 'info');
  }
}
