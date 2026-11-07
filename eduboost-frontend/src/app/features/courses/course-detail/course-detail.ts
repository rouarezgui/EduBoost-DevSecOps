import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../../../core/services/course.service';
import { AuthService } from '../../../core/services/auth';
import { CoursesApiService } from '../../../core/services/courses-api.service';
import { StudentApiService } from '../../../core/services/student-api.service';
import { ProgressApiService } from '../../../core/services/progress-api.service';
import { LearningApiService } from '../../../core/services/learning-api.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './course-detail.html',
  styleUrls: ['./course-detail.css']
})
export class CourseDetailComponent implements OnInit {
  course: any = null;
  currentUser: any = null;
  enrolling = false;

  feedbacks: any[] = [];
  showFeedbackModal = false;
  feedbackForm = { rating: 0, comment: '' };
  feedbackHover = 0;
  feedbackError = '';
  feedbackToast: string | null = null;
  toastTimer: any;
  userFeedback: any = null;

  activeTab: 'chapters' | 'quizzes' | 'feedback' = 'chapters';

  constructor(
    private route: ActivatedRoute,
    private cs: CourseService,
    private auth: AuthService,
    private coursesApi: CoursesApiService,
    private studentApi: StudentApiService,
    private progressApi: ProgressApiService,
    private learningApi: LearningApiService,
    private location: Location,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const id = Number(this.route.snapshot.params['id']);
    this.currentUser = this.auth.getCurrentUser();

    // Try to load course and chapters from backend
    this.coursesApi.getCourseChapters(id).pipe(
      catchError(() => of(null))
    ).subscribe(chapters => {
      // Load local course first
      this.course = this.cs.getCourse(id);
      if (chapters && chapters.length > 0 && this.course) {
        // Merge backend chapters into local course
        this.course = { ...this.course, chapters };
      }
      this.loadFeedbacks();
    });

    if (!this.course) {
      this.course = this.cs.getCourse(id);
      this.loadFeedbacks();
    }

    this.learningApi.trackEvent({ action: 'course_view', course_id: id, progress: 5 })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  enrollInCourse() {
    if (!this.currentUser) { this.showToast('Connectez-vous pour vous inscrire'); return; }
    this.enrolling = true;
    this.studentApi.enroll(this.course.id).pipe(
      catchError(err => {
        this.enrolling = false;
        this.showToast(err?.error?.detail || 'Erreur lors de l\'inscription');
        return of(null);
      })
    ).subscribe(res => {
      this.enrolling = false;
      if (res !== null) this.showToast('Inscription réussie! 🎉');
    });
  }

  trackChapterProgress(chapterId: number) {
    this.progressApi.createProgress({ course_id: this.course.id, chapter_id: chapterId, completed: true })
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.learningApi.trackEvent({ action: 'chapter_view', course_id: this.course.id, chapter_id: chapterId, progress: 20 })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  loadFeedbacks() {
    if (!isPlatformBrowser(this.platformId) || !this.course) return;
    const key = `eduboost_feedback_${this.course.id}`;
    this.feedbacks = JSON.parse(localStorage.getItem(key) || '[]');
    if (this.currentUser) {
      this.userFeedback = this.feedbacks.find((f: any) => f.userId === this.currentUser.id) || null;
    }
  }

  saveFeedbacks() {
    if (!isPlatformBrowser(this.platformId) || !this.course) return;
    localStorage.setItem(`eduboost_feedback_${this.course.id}`, JSON.stringify(this.feedbacks));
  }

  openFeedback() {
    this.feedbackForm = { rating: 0, comment: '' };
    this.feedbackError = '';
    this.feedbackHover = 0;
    this.showFeedbackModal = true;
  }

  closeFeedback() { this.showFeedbackModal = false; }
  setRating(n: number) { this.feedbackForm.rating = n; }
  setHover(n: number) { this.feedbackHover = n; }

  submitFeedback() {
    if (!this.feedbackForm.rating) { this.feedbackError = 'Veuillez sélectionner une note.'; return; }
    if (!this.feedbackForm.comment.trim()) { this.feedbackError = 'Veuillez écrire un commentaire.'; return; }
    const now = new Date();
    const timeStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    const userId = this.currentUser?.id || 0;
    const userName = this.currentUser?.name || 'Anonyme';
    const avatar = this.currentUser?.avatar || userName[0]?.toUpperCase() || 'U';
    const fb = { id: Date.now(), userId, userName, avatar, rating: this.feedbackForm.rating, comment: this.feedbackForm.comment, createdAt: timeStr };
    this.feedbacks.unshift(fb);
    this.userFeedback = fb;
    this.saveFeedbacks();
    this.closeFeedback();
    this.showToast('Avis soumis! Merci 🎉');
  }

  deleteFeedback(fb: any) {
    this.feedbacks = this.feedbacks.filter((f: any) => f.id !== fb.id);
    if (this.currentUser?.id === fb.userId) this.userFeedback = null;
    this.saveFeedbacks();
    this.showToast('Avis supprimé.');
  }

  showToast(msg: string) {
    clearTimeout(this.toastTimer);
    this.feedbackToast = msg;
    this.toastTimer = setTimeout(() => this.feedbackToast = null, 3200);
  }

  get avgRating(): number {
    if (!this.feedbacks.length) return 0;
    return Math.round(this.feedbacks.reduce((s: number, f: any) => s + f.rating, 0) / this.feedbacks.length * 10) / 10;
  }

  get stars() { return [1, 2, 3, 4, 5]; }
  starClass(n: number, rating: number) { return n <= rating ? 'star-filled' : 'star-empty'; }
  goBack() { this.location.back(); }
  getRatingLabel(n: number): string { return ['', 'Mauvais', 'Passable', 'Bien', 'Très bien', 'Excellent'][n] || ''; }
  getLevelClass(level: string) {
    if (level === 'Intermediate') return 'lv-blue';
    if (level === 'Advanced') return 'lv-orange';
    return 'lv-green';
  }
}
