import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { CourseService } from '../../../core/services/course.service';
import { CoursesApiService } from '../../../core/services/courses-api.service';
import { StudentApiService } from '../../../core/services/student-api.service';
import { AuthService } from '../../../core/services/auth';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './course-list.html',
  styleUrls: ['./course-list.css']
})
export class CourseListComponent implements OnInit {
  courses: any[] = [];
  searchTerm = '';
  activeFilter = 'All';
  filters = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  enrolling: Record<number, boolean> = {};
  enrollToast = '';
  enrollToastType = 'success';
  enrollTimer: any;

  get filteredCourses() {
    let list = this.courses;
    if (this.activeFilter !== 'All') {
      list = list.filter(c => (c.difficulty || 'Beginner') === this.activeFilter);
    }
    const term = this.searchTerm?.toLowerCase()?.trim();
    if (term) {
      list = list.filter(c =>
        (c.title || '').toLowerCase().includes(term) ||
        (c.description || '').toLowerCase().includes(term) ||
        (c.category || '').toLowerCase().includes(term)
      );
    }
    return list;
  }

  constructor(
    private cs: CourseService,
    private coursesApi: CoursesApiService,
    private studentApi: StudentApiService,
    private auth: AuthService,
    private location: Location,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Try to load courses from backend
    this.coursesApi.getCourses().pipe(
      catchError(() => of(null))
    ).subscribe(apiCourses => {
      if (apiCourses && apiCourses.length > 0) {
        this.courses = apiCourses;
      } else {
        this.courses = this.cs.list();
      }
    });
  }

  enroll(courseId: number) {
    const user = this.auth.getCurrentUser();
    if (!user) { this.showToast('Connectez-vous pour vous inscrire', 'danger'); return; }

    this.enrolling[courseId] = true;
    this.studentApi.enroll(courseId).pipe(
      catchError(err => {
        this.enrolling[courseId] = false;
        this.showToast(err?.error?.detail || 'Erreur lors de l\'inscription', 'danger');
        return of(null);
      })
    ).subscribe(res => {
      this.enrolling[courseId] = false;
      if (res !== null) {
        this.showToast('Inscription réussie! 🎉', 'success');
      }
    });
  }

  showToast(msg: string, type = 'success') {
    clearTimeout(this.enrollTimer);
    this.enrollToast = msg; this.enrollToastType = type;
    this.enrollTimer = setTimeout(() => this.enrollToast = '', 3000);
  }

  setFilter(f: string) { this.activeFilter = f; }
  clearFilters() { this.searchTerm = ''; this.activeFilter = 'All'; }
  levelClass(level: string) {
    if (level === 'Intermediate') return 'lv-blue';
    if (level === 'Advanced') return 'lv-orange';
    return 'lv-green';
  }
  goBack() { this.location.back(); }
}
