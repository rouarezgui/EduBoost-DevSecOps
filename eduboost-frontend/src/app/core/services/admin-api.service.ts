import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  constructor(private api: ApiService) {}

  getStudents(): Observable<any[]> {
    return this.api.get('/students/');
  }

  deleteStudent(studentId: number): Observable<any> {
    return this.api.delete(`/students/${studentId}`);
  }

  getStudentApprovals(): Observable<any[]> {
    return this.api.get('/approvals/students');
  }

  updateStudentApproval(studentId: number, status: 'pending' | 'approved' | 'rejected', comment = ''): Observable<any> {
    return this.api.put(`/approvals/students/${studentId}`, { status, comment });
  }

  getAdmins(): Observable<any[]> {
    return this.api.get('/admins/');
  }

  updateAdmin(adminId: number, admin: { username: string; email: string; password: string }): Observable<any> {
    return this.api.put(`/admins/${adminId}`, admin);
  }

  createCourse(course: { title: string; difficulty: string; price: number }): Observable<any> {
    return this.api.post('/courses/', course);
  }

  updateCourse(courseId: number, course: { title: string; difficulty: string; price: number }): Observable<any> {
    return this.api.put(`/courses/${courseId}`, course);
  }

  deleteCourse(courseId: number): Observable<any> {
    return this.api.delete(`/courses/${courseId}`);
  }

  createChapter(chapter: { title: string; content: string; course_id: number }): Observable<any> {
    return this.api.post('/chapters/', chapter);
  }

  updateChapter(chapterId: number, chapter: { title: string; content: string; course_id: number }): Observable<any> {
    return this.api.put(`/chapters/${chapterId}`, chapter);
  }

  deleteChapter(chapterId: number): Observable<any> {
    return this.api.delete(`/chapters/${chapterId}`);
  }

  createVideo(video: { title: string; url: string; duration: number; order: number; chapter_id: number }): Observable<any> {
    return this.api.post('/videos/', video);
  }

  updateVideo(videoId: number, video: { title: string; url: string; duration: number; order: number; chapter_id: number }): Observable<any> {
    return this.api.put(`/videos/${videoId}`, video);
  }

  deleteVideo(videoId: number): Observable<any> {
    return this.api.delete(`/videos/${videoId}`);
  }

  createQuiz(quiz: { questions: string; level: string; chapter_id: number }): Observable<any> {
    return this.api.post('/quiz/', quiz);
  }

  updateQuiz(quizId: number, quiz: { questions: string; level: string; chapter_id: number }): Observable<any> {
    return this.api.put(`/quiz/${quizId}`, quiz);
  }

  deleteQuiz(quizId: number): Observable<any> {
    return this.api.delete(`/quiz/${quizId}`);
  }
}
