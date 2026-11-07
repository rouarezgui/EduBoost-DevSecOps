import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { CoursesApiService } from '../../../core/services/courses-api.service';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-courses.html',
  styleUrls: ['./admin-courses.css']
})
export class AdminCoursesComponent implements OnInit {
  courses: any[] = [];
  filter = '';
  showModal = false;
  isEdit = false;
  deleteTarget: any = null;
  toast: { msg: string; type: string } | null = null;
  toastTimeout: any;
  editId: number | null = null;
  formError = '';

  // Course form
  form: any = { title: '', difficulty: 'Beginner', price: 0 };
  difficulties = ['Beginner', 'Intermediate', 'Advanced'];

  // View state: 'courses' | 'chapters' | 'videos' | 'quizzes'
  view: 'courses' | 'chapters' | 'videos' | 'quizzes' = 'courses';
  selectedCourse: any = null;
  selectedChapter: any = null;

  // Chapter modal
  showChapterModal = false;
  isEditChapter = false;
  editChapterId: number | null = null;
  chapterForm: any = { title: '', content: '' };
  selectedChapterPdfNames: string[] = [];
  chapterPdfError = '';
  deleteChapterTarget: any = null;

  // Video modal
  showVideoModal = false;
  isEditVideo = false;
  editVideoId: number | null = null;
  videoForm: any = { title: '', url: '', duration: 0, order: 1 };
  deleteVideoTarget: any = null;

  // Quiz modal
  showQuizModal = false;
  isEditQuiz = false;
  editQuizId: number | null = null;
  quizForm: any = { level: 'Beginner', chapter_id: null, questions: [] };
  deleteQuizTarget: any = null;
  newQuestion: any = { q: '', a: ['', '', '', ''], correct: 0 };

  constructor(
    private cs: CourseService,
    private adminApi: AdminApiService,
    private coursesApi: CoursesApiService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.load();
  }

  load() {
    this.coursesApi.getCourses().pipe(catchError(() => of(null))).subscribe(courses => {
      if (!courses) {
        this.courses = this.cs.list();
        this.cdr.detectChanges();
        return;
      }

      this.courses = courses;
      courses.forEach(course => this.loadCourseTree(course));
      this.cdr.detectChanges();
    });
  }

  private loadCourseTree(course: any) {
    this.coursesApi.getCourseChapters(course.id).pipe(catchError(() => of([]))).subscribe(chapters => {
      course.chapters = chapters || [];

      if (!course.chapters.length) {
        course.quizzes = [];
        this.cdr.detectChanges();
        return;
      }

      const videoRequests = course.chapters.map((chapter: any) =>
        this.coursesApi.getChapterVideos(chapter.id).pipe(catchError(() => of([])))
      );
      const quizRequests = course.chapters.map((chapter: any) =>
        this.coursesApi.getChapterQuiz(chapter.id).pipe(catchError(() => of([])))
      );

      forkJoin(videoRequests).subscribe(videoGroups => {
        const groups = videoGroups as any[][];
        course.chapters.forEach((chapter: any, index: number) => chapter.videos = groups[index] || []);
        this.cdr.detectChanges();
      });

      forkJoin(quizRequests).subscribe(quizGroups => {
        course.quizzes = (quizGroups as any[][]).flat();
        this.cdr.detectChanges();
      });
      this.cdr.detectChanges();
    });
  }

  get filteredCourses() {
    const term = this.filter.toLowerCase().trim();
    if (!term) return this.courses;
    return this.courses.filter(c =>
      c.title.toLowerCase().includes(term) ||
      (c.difficulty || c.level || '').toLowerCase().includes(term)
    );
  }

  // ── Course CRUD ──
  openCreate() {
    this.isEdit = false;
    this.form = { title: '', difficulty: 'Beginner', price: 0 };
    this.formError = '';
    this.showModal = true;
  }

  openEdit(c: any) {
    this.isEdit = true;
    this.editId = c.id;
    this.form = { title: c.title, difficulty: c.difficulty || 'Beginner', price: c.price ?? 0 };
    this.formError = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.formError = ''; }

  saveCourse() {
    if (!this.form.title.trim()) { this.formError = 'Title is required.'; return; }
    const payload = {
      title: this.form.title,
      difficulty: this.form.difficulty,
      price: Number(this.form.price) || 0
    };
    if (this.isEdit) {
      this.adminApi.updateCourse(this.editId!, payload).pipe(catchError(err => {
        this.formError = err?.error?.detail || 'Course update failed.';
        return of(null);
      })).subscribe(res => {
        if (!res) return;
        this.showToast('Course updated successfully', 'success');
        this.load();
        this.closeModal();
      });
    } else {
      this.adminApi.createCourse(payload).pipe(catchError(err => {
        this.formError = err?.error?.detail || 'Course creation failed.';
        return of(null);
      })).subscribe(newCourse => {
        if (!newCourse) return;
        this.showToast('Course created! Now add chapters.', 'success');
        this.load();
        this.closeModal();
        this.openChaptersView({ ...newCourse, chapters: [], quizzes: [] });
      });
    }
  }

  confirmDelete(c: any) { this.deleteTarget = c; }
  cancelDelete() { this.deleteTarget = null; }

  deleteCourse() {
    if (!this.deleteTarget) return;
    this.adminApi.deleteCourse(this.deleteTarget.id).pipe(catchError(err => {
      this.showToast(err?.error?.detail || 'Course delete failed', 'danger');
      return of(null);
    })).subscribe(res => {
      if (!res) return;
      this.deleteTarget = null;
      this.load();
      this.showToast('Course deleted', 'danger');
    });
  }

  // ── Navigate to sub-views ──
  openChaptersView(c: any) {
    this.selectedCourse = c;
    this.loadCourseTree(this.selectedCourse);
    this.view = 'chapters';
    this.cdr.detectChanges();
  }

  openVideosView(chapter: any) {
    this.selectedChapter = chapter;
    this.view = 'videos';
    this.cdr.detectChanges();
  }

  openQuizzesView(c: any) {
    this.selectedCourse = c;
    this.loadCourseTree(this.selectedCourse);
    this.view = 'quizzes';
    this.cdr.detectChanges();
  }

  backToCourses() { this.view = 'courses'; this.selectedCourse = null; this.selectedChapter = null; this.load(); }
  backToChapters() { this.view = 'chapters'; this.selectedChapter = null; this.loadCourseTree(this.selectedCourse); }
  backToCoursesFromQuiz() { this.view = 'courses'; this.selectedCourse = null; this.load(); }

  // ── Chapter CRUD ──
  get chapters(): any[] { return this.selectedCourse?.chapters || []; }

  openCreateChapter() {
    this.isEditChapter = false;
    this.chapterForm = { title: '', content: '' };
    this.resetChapterPdfs();
    this.showChapterModal = true;
  }

  openEditChapter(ch: any) {
    this.isEditChapter = true;
    this.editChapterId = ch.id;
    this.chapterForm = { title: ch.title, content: ch.content || '' };
    this.resetChapterPdfs();
    this.showChapterModal = true;
  }

  closeChapterModal() {
    this.showChapterModal = false;
    this.resetChapterPdfs();
  }

  onChapterPdfsSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.chapterPdfError = '';
    this.selectedChapterPdfNames = [];

    if (!files.length) return;

    const invalidFile = files.find(file =>
      file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')
    );

    if (invalidFile) {
      this.chapterPdfError = 'Only PDF files are allowed.';
      input.value = '';
      return;
    }

    if (files.length > 4) {
      this.chapterPdfError = 'You can upload up to 4 PDFs.';
      input.value = '';
      return;
    }

    this.selectedChapterPdfNames = files.map(file => file.name);
  }

  private resetChapterPdfs() {
    this.selectedChapterPdfNames = [];
    this.chapterPdfError = '';
  }

  saveChapter() {
    if (!this.chapterForm.title.trim()) return;
    const payload = {
      title: this.chapterForm.title,
      content: this.chapterForm.content || '',
      course_id: this.selectedCourse.id
    };
    if (this.isEditChapter) {
      this.adminApi.updateChapter(this.editChapterId!, payload).pipe(catchError(() => of(null))).subscribe(res => {
        if (!res) return;
        this.showToast('Chapter updated', 'success');
        this.loadCourseTree(this.selectedCourse);
        this.closeChapterModal();
      });
    } else {
      this.adminApi.createChapter(payload).pipe(catchError(() => of(null))).subscribe(res => {
        if (!res) return;
        this.showToast('Chapter added', 'success');
        this.loadCourseTree(this.selectedCourse);
        this.closeChapterModal();
      });
    }
  }

  confirmDeleteChapter(ch: any) { this.deleteChapterTarget = ch; }
  cancelDeleteChapter() { this.deleteChapterTarget = null; }

  deleteChapter() {
    if (!this.deleteChapterTarget) return;
    this.adminApi.deleteChapter(this.deleteChapterTarget.id).pipe(catchError(() => of(null))).subscribe(res => {
      if (!res) return;
      this.deleteChapterTarget = null;
      this.loadCourseTree(this.selectedCourse);
      this.showToast('Chapter deleted', 'danger');
    });
  }

  // ── Video CRUD ──
  get videos(): any[] { return this.selectedChapter?.videos || []; }

  openCreateVideo() {
    this.isEditVideo = false;
    this.videoForm = { title: '', url: '', duration: 0, order: (this.videos.length + 1) };
    this.showVideoModal = true;
  }

  openEditVideo(v: any) {
    this.isEditVideo = true;
    this.editVideoId = v.id;
    this.videoForm = { title: v.title, url: v.url || '', duration: v.duration || 0, order: v.order || 1 };
    this.showVideoModal = true;
  }

  closeVideoModal() { this.showVideoModal = false; }

  saveVideo() {
    if (!this.videoForm.title.trim()) return;
    const payload = {
      title: this.videoForm.title,
      url: this.videoForm.url || '',
      duration: Number(this.videoForm.duration) || 0,
      order: Number(this.videoForm.order) || 1,
      chapter_id: this.selectedChapter.id
    };
    if (this.isEditVideo) {
      this.adminApi.updateVideo(this.editVideoId!, payload).pipe(catchError(() => of(null))).subscribe(res => {
        if (!res) return;
        this.showToast('Video updated', 'success');
        this.refreshSelectedChapter();
        this.closeVideoModal();
      });
    } else {
      this.adminApi.createVideo(payload).pipe(catchError(() => of(null))).subscribe(res => {
        if (!res) return;
        this.showToast('Video added', 'success');
        this.refreshSelectedChapter();
        this.closeVideoModal();
      });
    }
  }

  confirmDeleteVideo(v: any) { this.deleteVideoTarget = v; }
  cancelDeleteVideo() { this.deleteVideoTarget = null; }

  deleteVideo() {
    if (!this.deleteVideoTarget) return;
    this.adminApi.deleteVideo(this.deleteVideoTarget.id).pipe(catchError(() => of(null))).subscribe(res => {
      if (!res) return;
      this.deleteVideoTarget = null;
      this.refreshSelectedChapter();
      this.showToast('Video deleted', 'danger');
    });
  }

  private refreshSelectedChapter() {
    this.coursesApi.getChapterVideos(this.selectedChapter.id).pipe(catchError(() => of([]))).subscribe(videos => {
      this.selectedChapter.videos = videos || [];
      const chapter = this.selectedCourse.chapters.find((ch: any) => ch.id === this.selectedChapter.id);
      if (chapter) chapter.videos = this.selectedChapter.videos;
      this.cdr.detectChanges();
    });
  }

  // ── Quiz CRUD ──
  get quizzes(): any[] { return this.selectedCourse?.quizzes || []; }

  openCreateQuiz() {
    this.isEditQuiz = false;
    this.quizForm = { level: 'Beginner', chapter_id: this.chapters[0]?.id || null, questions: [] };
    this.newQuestion = { q: '', a: ['', '', '', ''], correct: 0 };
    this.showQuizModal = true;
  }

  openEditQuiz(q: any) {
    this.isEditQuiz = true;
    this.editQuizId = q.id;
    this.quizForm = {
      level: q.level || 'Beginner',
      chapter_id: q.chapter_id || this.chapters[0]?.id || null,
      questions: JSON.parse(JSON.stringify(q.questions || []))
    };
    this.newQuestion = { q: '', a: ['', '', '', ''], correct: 0 };
    this.showQuizModal = true;
  }

  closeQuizModal() { this.showQuizModal = false; }

  addQuestion() {
    if (!this.newQuestion.q.trim()) return;
    this.quizForm.questions.push({ ...this.newQuestion, a: [...this.newQuestion.a], correct: Number(this.newQuestion.correct) });
    this.newQuestion = { q: '', a: ['', '', '', ''], correct: 0 };
  }

  removeQuestion(i: number) { this.quizForm.questions.splice(i, 1); }

  saveQuiz() {
    if (!this.quizForm.chapter_id) return;
    const payload = {
      questions: JSON.stringify(this.quizForm.questions || []),
      level: this.quizForm.level || 'Beginner',
      chapter_id: Number(this.quizForm.chapter_id)
    };
    if (this.isEditQuiz) {
      this.adminApi.updateQuiz(this.editQuizId!, payload).pipe(catchError(() => of(null))).subscribe(res => {
        if (!res) return;
        this.showToast('Quiz updated', 'success');
        this.loadCourseTree(this.selectedCourse);
        this.closeQuizModal();
      });
    } else {
      this.adminApi.createQuiz(payload).pipe(catchError(() => of(null))).subscribe(res => {
        if (!res) return;
        this.showToast('Quiz added', 'success');
        this.loadCourseTree(this.selectedCourse);
        this.closeQuizModal();
      });
    }
  }

  confirmDeleteQuiz(q: any) { this.deleteQuizTarget = q; }
  cancelDeleteQuiz() { this.deleteQuizTarget = null; }

  deleteQuiz() {
    if (!this.deleteQuizTarget) return;
    this.adminApi.deleteQuiz(this.deleteQuizTarget.id).pipe(catchError(() => of(null))).subscribe(res => {
      if (!res) return;
      this.deleteQuizTarget = null;
      this.loadCourseTree(this.selectedCourse);
      this.showToast('Quiz deleted', 'danger');
    });
  }

  showToast(msg: string, type: string) {
    clearTimeout(this.toastTimeout);
    this.toast = { msg, type };
    this.toastTimeout = setTimeout(() => this.toast = null, 3000);
  }

  levelColor(level: string) {
    if (level === 'Beginner') return 'lv-green';
    if (level === 'Intermediate') return 'lv-blue';
    return 'lv-orange';
  }
}
