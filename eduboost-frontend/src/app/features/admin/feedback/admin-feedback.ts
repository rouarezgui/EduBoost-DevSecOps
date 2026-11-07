import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-admin-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-feedback.html',
  styleUrls: ['./admin-feedback.css']
})
export class AdminFeedbackComponent implements OnInit {
  courses: any[] = [];
  selectedCourseId: number | null = null;
  feedbacks: any[] = [];
  filter = '';
  deleteTarget: any = null;
  toast: { msg: string; type: string } | null = null;
  toastTimeout: any;

  constructor(
    private cs: CourseService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.courses = this.cs.list();
    if (this.courses.length) {
      this.selectedCourseId = this.courses[0].id;
      this.loadFeedbacks();
    }
  }

  loadFeedbacks() {
    if (this.selectedCourseId === null) return;
    this.feedbacks = this.cs.getFeedbacks(this.selectedCourseId);
  }

  selectCourse(id: number) {
    this.selectedCourseId = id;
    this.loadFeedbacks();
  }

  get filteredFeedbacks() {
    const t = this.filter.toLowerCase().trim();
    if (!t) return this.feedbacks;
    return this.feedbacks.filter(f =>
      f.userName?.toLowerCase().includes(t) || f.comment?.toLowerCase().includes(t)
    );
  }

  get avgRating(): string {
    if (!this.feedbacks.length) return '—';
    const avg = this.feedbacks.reduce((s, f) => s + (f.rating || 0), 0) / this.feedbacks.length;
    return avg.toFixed(1);
  }

  stars(n: number): number[] { return Array(n).fill(0); }
  emptyStars(n: number): number[] { return Array(5 - n).fill(0); }

  confirmDelete(f: any) { this.deleteTarget = f; }
  cancelDelete() { this.deleteTarget = null; }

  deleteFeedback() {
    if (!this.deleteTarget || this.selectedCourseId === null) return;
    this.cs.deleteFeedback(this.selectedCourseId, this.deleteTarget.id);
    this.deleteTarget = null;
    this.loadFeedbacks();
    this.showToast('Feedback deleted', 'danger');
  }

  showToast(msg: string, type: string) {
    clearTimeout(this.toastTimeout);
    this.toast = { msg, type };
    this.toastTimeout = setTimeout(() => this.toast = null, 3000);
  }

  get selectedCourse() {
    return this.courses.find(c => c.id === this.selectedCourseId);
  }
}
