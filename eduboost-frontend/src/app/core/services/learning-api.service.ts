import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class LearningApiService {
  constructor(private api: ApiService) {}

  trackEvent(data: {
    action: string;
    course_id?: number;
    chapter_id?: number;
    quiz_id?: number;
    score?: number;
    progress?: number;
    time?: number;
  }): Observable<any> {
    return this.api.post('/learning/events', data);
  }

  getSummary(): Observable<any> {
    return this.api.get('/learning/me/summary');
  }
}
