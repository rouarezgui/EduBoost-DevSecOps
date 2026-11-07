import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class StudentApiService {
  constructor(private api: ApiService) {}

  getMe(): Observable<any> {
    return this.api.get('/students/me');
  }

  getDashboard(): Observable<any> {
    return this.api.get('/students/me/dashboard');
  }

  getFullHistory(): Observable<any> {
    return this.api.get('/students/me/full-history');
  }

  getActivities(): Observable<any> {
    return this.api.get('/students/me/activities');
  }

  getMyCourses(): Observable<any> {
    return this.api.get('/courses/me/courses');
  }

  enroll(courseId: number): Observable<any> {
    return this.api.post(`/students/enroll/${courseId}`, {});
  }

  getStudentRisk(studentId: number): Observable<any> {
    return this.api.get(`/risk/student/${studentId}`);
  }
}
