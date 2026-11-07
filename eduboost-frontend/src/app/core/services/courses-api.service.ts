import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CoursesApiService {
  constructor(private api: ApiService) {}

  getCourses(): Observable<any[]> {
    return this.api.get<any[]>('/courses/').pipe(
      map(courses => (courses || []).map(course => this.normalizeCourse(course)))
    );
  }

  searchCourses(query: string): Observable<any[]> {
    return this.api.get<any[]>(`/courses/search?query=${encodeURIComponent(query)}`).pipe(
      map(courses => (courses || []).map(course => this.normalizeCourse(course)))
    );
  }

  getCourseChapters(courseId: number): Observable<any[]> {
    return this.api.get(`/courses/${courseId}/chapters`);
  }

  getChapterVideos(chapterId: number): Observable<any[]> {
    return this.api.get(`/chapters/${chapterId}/videos`);
  }

  getChapterQuiz(chapterId: number): Observable<any> {
    return this.api.get<any[]>(`/chapters/${chapterId}/quiz`).pipe(
      map(quizzes => (quizzes || []).map(quiz => this.normalizeQuiz(quiz)))
    );
  }

  getVideoById(videoId: number): Observable<any> {
    return this.api.get(`/videos/${videoId}`);
  }

  normalizeCourse(course: any): any {
    return {
      ...course,
      description: course.description || '',
      category: course.category || 'General',
      duration: course.duration || '',
      image: course.image || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80',
      chapters: course.chapters || [],
      quizzes: course.quizzes || []
    };
  }

  normalizeQuiz(quiz: any): any {
    const parsedQuestions = this.parseQuestions(quiz?.questions);
    return {
      ...quiz,
      title: quiz.title || `Quiz #${quiz.id}`,
      questions: parsedQuestions
    };
  }

  parseQuestions(questions: any): any[] {
    if (Array.isArray(questions)) return questions;
    if (!questions) return [];

    try {
      const parsed = JSON.parse(questions);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return String(questions)
        .split('\n')
        .filter(line => line.trim())
        .map(line => ({ q: line.trim(), a: ['True', 'False'], correct: 0 }));
    }
  }
}
