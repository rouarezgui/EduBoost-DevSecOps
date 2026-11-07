import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export const API_BASE = 'http://127.0.0.1:8000';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${API_BASE}${path}`, { headers: this.getHeaders() })
      .pipe(map(response => this.unwrapResponse<T>(response)), catchError(this.handleError));
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(`${API_BASE}${path}`, body, { headers: this.getHeaders() })
      .pipe(map(response => this.unwrapResponse<T>(response)), catchError(this.handleError));
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(`${API_BASE}${path}`, body, { headers: this.getHeaders() })
      .pipe(map(response => this.unwrapResponse<T>(response)), catchError(this.handleError));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${API_BASE}${path}`, { headers: this.getHeaders() })
      .pipe(map(response => this.unwrapResponse<T>(response)), catchError(this.handleError));
  }

  private unwrapResponse<T>(response: any): T {
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as T;
    }
    return response as T;
  }

  private handleError(error: any) {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}
