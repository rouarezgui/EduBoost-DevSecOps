import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { API_BASE } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private router: Router, private http: HttpClient) {}

  private isBrowser() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private getHeaders(): HttpHeaders {
    const token = this.isBrowser() ? localStorage.getItem('token') : null;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  /** LOGIN via backend */
  loginApi(email: string, password: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);
    return this.http.post<any>(`${API_BASE}/auth/login`, body.toString(), {
      headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
    }).pipe(
      tap(res => {
        if (res.access_token) {
          if (this.isBrowser()) localStorage.setItem('token', res.access_token);
        }
      })
    );
  }

  /** Get current user from backend */
  fetchCurrentUser(): Observable<any> {
    return this.http.get<any>(`${API_BASE}/auth/me`, { headers: this.getHeaders() }).pipe(
      tap(user => {
        if (this.isBrowser() && user) localStorage.setItem('user', JSON.stringify(user));
      }),
      catchError(() => of(null))
    );
  }

  /** REGISTER via backend */
  registerApi(data: { email: string; password: string; username?: string; phone?: string }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/auth/register`, data, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${API_BASE}/password/forgot`, { email }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  fetchMyApproval(): Observable<any> {
    return this.http.get<any>(`${API_BASE}/approvals/me`, { headers: this.getHeaders() });
  }

  getStudentApprovalStatus(student: { id?: number; email?: string }): 'pending' | 'approved' | 'rejected' {
    if (!this.isBrowser()) return 'pending';
    const approvals = this.getStudentApprovals();
    const key = this.getApprovalKey(student);
    return approvals[key] || 'pending';
  }

  setStudentApproval(student: { id?: number; email?: string }, status: 'pending' | 'approved' | 'rejected') {
    if (!this.isBrowser()) return;
    const approvals = this.getStudentApprovals();
    approvals[this.getApprovalKey(student)] = status;
    if (student.email) approvals[this.getApprovalKey({ email: student.email })] = status;
    if (student.id) approvals[this.getApprovalKey({ id: student.id })] = status;
    localStorage.setItem('eduboost_student_approvals', JSON.stringify(approvals));
  }

  isStudentApproved(student: { id?: number; email?: string; role?: string; type?: string }): boolean {
    const role = student.role || student.type;
    if (role === 'admin') return true;
    return this.getStudentApprovalStatus(student) === 'approved';
  }

  clearSession() {
    if (!this.isBrowser()) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /** Update password */
  updatePassword(current_password: string, new_password: string): Observable<any> {
    return this.http.put<any>(`${API_BASE}/auth/me/password`, { old_password: current_password, new_password }, {
      headers: this.getHeaders()
    });
  }

  /** Update student profile */
  updateStudent(studentId: number, data: any): Observable<any> {
    return this.http.put<any>(`${API_BASE}/students/${studentId}`, data, {
      headers: this.getHeaders()
    });
  }

  // Legacy synchronous helpers (kept for admin panel)
  login(email: string, password: string): boolean {
    if (!this.isBrowser()) return false;
    const users = this.getLocalUsers();
    const user = users.find((u: any) => u.email === email && u.password === password && !u.disabled);
    if (user) {
      localStorage.setItem('token', 'local-token-' + user.id);
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    }
    return false;
  }

  signup(name: string, email: string, password: string, phone?: string) {
    const users = this.getLocalUsers();
    if (users.find((u: any) => u.email === email)) throw new Error('Email already used');
    const id = users.length ? Math.max(...users.map((u: any) => u.id)) + 1 : 1;
    const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    const user = { id, name, email, password, phone: phone || '', role: 'student', disabled: false, avatar: initials, joinDate: new Date().toISOString().split('T')[0] };
    users.push(user);
    this.setStudentApproval(user, 'pending');
    this.saveLocalUsers(users);
    if (this.isBrowser()) {
      localStorage.setItem('token', 'local-token-' + id);
      localStorage.setItem('user', JSON.stringify(user));
    }
    return user;
  }

  getCurrentUser() {
    if (!this.isBrowser()) return null;
    return JSON.parse(localStorage.getItem('user') || 'null');
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser()) return false;
    return !!localStorage.getItem('token');
  }

  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.router.navigate(['/login']);
  }

  private getLocalUsers(): any[] {
    if (!this.isBrowser()) return [];
    return JSON.parse(localStorage.getItem('eduboost_users') || '[]');
  }

  private getStudentApprovals(): Record<string, 'pending' | 'approved' | 'rejected'> {
    if (!this.isBrowser()) return {};
    return JSON.parse(localStorage.getItem('eduboost_student_approvals') || '{}');
  }

  private getApprovalKey(student: { id?: number; email?: string }): string {
    if (student.email) return `email:${student.email.toLowerCase().trim()}`;
    return `id:${student.id ?? 'unknown'}`;
  }
  private saveLocalUsers(users: any[]) {
    if (!this.isBrowser()) return;
    localStorage.setItem('eduboost_users', JSON.stringify(users));
  }

  listUsers() { return this.getLocalUsers(); }

  createUser(data: { name: string; email: string; password: string; role: string; phone?: string }) {
    const users = this.getLocalUsers();
    if (users.find((u: any) => u.email === data.email)) throw new Error('Email already used');
    const id = users.length ? Math.max(...users.map((u: any) => u.id)) + 1 : 1;
    const initials = data.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    const user = { id, ...data, phone: data.phone || '', disabled: false, avatar: initials, joinDate: new Date().toISOString().split('T')[0] };
    users.push(user);
    this.saveLocalUsers(users);
    return user;
  }

  updateUser(id: number, data: Partial<{ name: string; email: string; password: string; role: string; phone: string }>) {
    const users = this.getLocalUsers();
    const u = users.find((x: any) => x.id === id);
    if (!u) return;
    Object.assign(u, data);
    if (data.name) u.avatar = data.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    this.saveLocalUsers(users);
    if (this.isBrowser()) {
      const sessionUser = this.getCurrentUser();
      if (sessionUser && sessionUser.id === id) {
        localStorage.setItem('user', JSON.stringify({ ...sessionUser, ...data }));
      }
    }
  }

  deleteUser(id: number) {
    let users = this.getLocalUsers();
    users = users.filter((u: any) => u.id !== id);
    this.saveLocalUsers(users);
  }

  toggleUserDisabled(id: number) {
    const users = this.getLocalUsers();
    const u = users.find((x: any) => x.id === id);
    if (u) { u.disabled = !u.disabled; this.saveLocalUsers(users); }
  }

  setRole(id: number, role: string) {
    const users = this.getLocalUsers();
    const u = users.find((x: any) => x.id === id);
    if (u) { u.role = role; this.saveLocalUsers(users); }
  }

  addNotification(text: string, color: string = 'blue') {
    if (!this.isBrowser()) return;
    const notifs = this.getNotifications();
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    notifs.unshift({ id: Date.now(), color, text, time, read: false });
    localStorage.setItem('eduboost_notifications', JSON.stringify(notifs.slice(0, 20)));
  }

  getNotifications() {
    if (!this.isBrowser()) return [];
    return JSON.parse(localStorage.getItem('eduboost_notifications') || '[]');
  }

  markAllNotificationsRead() {
    if (!this.isBrowser()) return;
    const notifs = this.getNotifications().map((n: any) => ({ ...n, read: true }));
    localStorage.setItem('eduboost_notifications', JSON.stringify(notifs));
  }

  getUnreadCount() { return this.getNotifications().filter((n: any) => !n.read).length; }
}
