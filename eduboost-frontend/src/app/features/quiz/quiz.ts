import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CourseService } from '../../core/services/course.service';
import { AuthService } from '../../core/services/auth';
import { QuizApiService } from '../../core/services/quiz-api.service';
import { ProgressApiService } from '../../core/services/progress-api.service';
import { LearningApiService } from '../../core/services/learning-api.service';
import { StudentAnalyticsService, StudentAnalytics } from '../../core/services/student-analytics.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz.html',
  styleUrls: ['./quiz.css']
})
export class QuizComponent {
  quiz: any = null;
  courseId = 0;
  answers: (number | null)[] = [];
  score: number | null = null;
  correctCount = 0;
  submitting = false;
  analytics: StudentAnalytics | null = null;

  constructor(
    private route: ActivatedRoute,
    private cs: CourseService,
    private auth: AuthService,
    private quizApi: QuizApiService,
    private progressApi: ProgressApiService,
    private learningApi: LearningApiService,
    private analyticsService: StudentAnalyticsService,
    private location: Location,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    const cId = Number(this.route.snapshot.params['courseId']);
    const qId = Number(this.route.snapshot.params['quizId']);
    this.courseId = cId;
    const course = this.cs.getCourse(cId);
    if (course) {
      this.quiz = (course.quizzes || []).find((q: any) => q.id == qId);
    }
    if (this.quiz) {
      this.answers = new Array(this.quiz.questions?.length || 0).fill(null);
    }
  }

  submit() {
    if (!this.quiz) return;
    this.submitting = true;
    let correct = 0;
    for (let i = 0; i < this.quiz.questions.length; i++) {
      if (this.answers[i] == this.quiz.questions[i].correct) correct++;
    }
    this.correctCount = correct;
    const percent = Math.round((correct / this.quiz.questions.length) * 100);
    this.score = percent;
    const errors = this.quiz.questions.length - correct;
    this.analytics = this.analyticsService.calculateFromSingleQuiz(percent, errors);

    if (isPlatformBrowser(this.platformId)) {
      const user = this.auth.getCurrentUser();
      // Save locally
      this.cs.addAttempt(this.courseId, this.quiz.id, user?.id || 0, percent);

      // Also submit to backend using the existing FastAPI schemas.
      this.quizApi.submitResult({
        quiz_id: this.quiz.id,
        score: percent,
        errors,
        student_id: user?.id
      }).pipe(catchError(() => of(null))).subscribe(() => {
        this.submitting = false;
      });

      this.progressApi.createProgress({
        score: percent,
        time: 0,
        student_id: user?.id
      }).pipe(catchError(() => of(null))).subscribe();

      this.learningApi.trackEvent({
        action: 'quiz_submit',
        course_id: this.courseId,
        quiz_id: this.quiz.id,
        score: percent,
        progress: percent,
        time: 0
      }).pipe(catchError(() => of(null))).subscribe();
    } else {
      this.submitting = false;
    }
  }

  answeredCount(): number {
    return this.answers.filter(a => a !== null && a !== undefined).length;
  }

  reset() {
    this.answers = new Array(this.quiz?.questions?.length || 0).fill(null);
    this.score = null;
    this.correctCount = 0;
    this.submitting = false;
    this.analytics = null;
  }

  goBack() { this.location.back(); }
}
