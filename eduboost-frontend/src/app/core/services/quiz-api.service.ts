import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class QuizApiService {
  constructor(private api: ApiService, private auth: AuthService) {}

  getQuizzes(): Observable<any[]> {
    return this.api.get('/quiz/');
  }

  getQuizResults(quizId: number): Observable<any[]> {
    return this.api.get(`/quiz/${quizId}/results`);
  }

  submitResult(data: { quiz_id: number; score: number; errors: number; student_id?: number }): Observable<any> {
    const user = this.auth.getCurrentUser();
    return this.api.post('/quiz-results/', {
      quiz_id: data.quiz_id,
      score: data.score,
      errors: data.errors,
      student_id: data.student_id ?? user?.id
    });
  }

  getMyResults(): Observable<any[]> {
    return this.api.get('/quiz-results/me');
  }
}
