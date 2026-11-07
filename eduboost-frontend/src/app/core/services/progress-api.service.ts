import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class ProgressApiService {
  constructor(private api: ApiService, private auth: AuthService) {}

  createProgress(data: {
    score?: number;
    time?: number;
    student_id?: number;
    completed?: boolean;
    course_id?: number;
    chapter_id?: number;
    video_id?: number;
  }): Observable<any> {
    const user = this.auth.getCurrentUser();
    return this.api.post('/progress/', {
      score: data.score ?? (data.completed ? 100 : 10),
      time: data.time ?? 0,
      student_id: data.student_id ?? user?.id
    });
  }

  getMyProgress(): Observable<any[]> {
    return this.api.get('/progress/me');
  }
}
