import { ChangeDetectorRef, Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { CourseService } from '../../../core/services/course.service';
import { StudentApiService } from '../../../core/services/student-api.service';
import { QuizApiService } from '../../../core/services/quiz-api.service';
import { ProgressApiService } from '../../../core/services/progress-api.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-profile.html',
  styleUrls: ['./student-profile.css']
})
export class StudentProfileComponent implements OnInit {
  user: any = null;
  editMode = false;
  editForm: any = {};
  toast = ''; toastType = 'success'; toastTimer: any;
  saving = false;

  showPwModal = false;
  pwForm = { current: '', newPw: '', confirm: '' };
  pwError = '';

  quizCount = 0;
  avgScore = 0;
  courseCount = 0;

  progressCount = 0;

  constructor(
    private auth: AuthService,
    private cs: CourseService,
    private studentApi: StudentApiService,
    private quizApi: QuizApiService,
    private progressApi: ProgressApiService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.user = this.auth.getCurrentUser();

    // Load real data from backend
    this.auth.fetchCurrentUser().pipe(catchError(() => of(null))).subscribe(student => {
      if (student) {
        const merged = {
          ...this.user,
          ...student,
          name: student.username || this.user?.name,
          role: student.type,
          avatar: (student.username || this.user?.name || '??').substring(0, 2).toUpperCase()
        };
        this.user = merged;
        localStorage.setItem('user', JSON.stringify(merged));
        this.cdr.detectChanges();
      }
    });

    this.quizApi.getMyResults().pipe(catchError(() => of(null))).subscribe(results => {
      if (results && results.length > 0) {
        this.quizCount = results.length;
        this.avgScore = Math.round(results.reduce((s: number, r: any) => s + (r.score || 0), 0) / results.length);
      } else {
        // Fallback local
        if (this.user) {
          const attempts = this.cs.getAttemptsForUser(this.user.id);
          this.quizCount = attempts.length;
          this.avgScore = attempts.length
            ? Math.round(attempts.reduce((s: number, a: any) => s + a.score, 0) / attempts.length)
            : 0;
        }
      }
      this.cdr.detectChanges();
    });

    this.studentApi.getMyCourses().pipe(catchError(() => of([]))).subscribe(courses => {
      this.courseCount = courses.length;
      this.cdr.detectChanges();
    });

    this.progressApi.getMyProgress().pipe(catchError(() => of([]))).subscribe(progress => {
      this.progressCount = progress.length;
      this.cdr.detectChanges();
    });
  }

  startEdit() {
    this.editForm = { name: this.user.name || this.user.username, email: this.user.email, password: '' };
    this.editMode = true;
  }
  cancelEdit() { this.editMode = false; }

  saveProfile() {
    if (!this.editForm.name?.trim()) { this.showToast('Le nom ne peut pas être vide', 'danger'); return; }
    this.saving = true;

    // Update via backend
    if (this.user?.id) {
      if (!this.editForm.password?.trim()) {
        this.saving = false;
        this.showToast('Password is required to update account info.', 'danger');
        return;
      }
      this.auth.updateStudent(this.user.id, {
        username: this.editForm.name,
        email: this.editForm.email,
        password: this.editForm.password
      })
        .pipe(catchError(() => of(null)))
        .subscribe(() => {
          this.auth.updateUser(this.user.id, { name: this.editForm.name, email: this.editForm.email });
          const updated = {
            ...this.user,
            name: this.editForm.name,
            username: this.editForm.name,
            email: this.editForm.email,
            avatar: this.editForm.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
          };
          if (isPlatformBrowser(this.platformId)) localStorage.setItem('user', JSON.stringify(updated));
          this.user = updated;
          this.editMode = false;
          this.saving = false;
          this.showToast('Profil mis à jour!', 'success');
        });
    } else {
      this.auth.updateUser(this.user.id, { name: this.editForm.name, email: this.editForm.email });
      this.editMode = false;
      this.saving = false;
      this.showToast('Profil mis à jour!', 'success');
    }
  }

  changePassword() {
    this.pwError = '';
    if (!this.pwForm.current) { this.pwError = 'Entrez votre mot de passe actuel.'; return; }
    if (this.pwForm.newPw.length < 4) { this.pwError = 'Nouveau mot de passe ≥ 4 caractères.'; return; }
    if (this.pwForm.newPw !== this.pwForm.confirm) { this.pwError = 'Les mots de passe ne correspondent pas.'; return; }

    this.auth.updatePassword(this.pwForm.current, this.pwForm.newPw)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.auth.updateUser(this.user.id, { password: this.pwForm.newPw });
        this.showPwModal = false;
        this.pwForm = { current: '', newPw: '', confirm: '' };
        this.showToast('Mot de passe mis à jour!', 'success');
      });
  }

  showToast(msg: string, type = 'success') {
    clearTimeout(this.toastTimer);
    this.toast = msg; this.toastType = type;
    this.toastTimer = setTimeout(() => this.toast = '', 3200);
  }

  getInitials() {
    return (this.user?.name || this.user?.username || '??').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
  getJoinDate() {
    const d = this.user?.joinDate || this.user?.created_at;
    return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
  }
}
