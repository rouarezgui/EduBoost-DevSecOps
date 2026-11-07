import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class RagApiService {
  constructor(private api: ApiService) {}

  getHistory(): Observable<any[]> {
    return this.api.get('/rag/history');
  }

  sendMessage(message: string): Observable<any> {
    return this.api.post('/rag/chat', { message });
  }

  clearHistory(): Observable<any> {
    return this.api.delete('/rag/history');
  }
}
