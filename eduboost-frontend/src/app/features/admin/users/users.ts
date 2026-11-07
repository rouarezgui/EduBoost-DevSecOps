import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  filter = '';
  showModal = false;
  isEdit = false;
  deleteTarget: any = null;
  toast: { msg: string; type: string } | null = null;
  toastTimeout: any;

  form: any = { name: '', email: '', password: '', role: 'student', phone: '' };
  editId: number | null = null;
  formError = '';

  constructor(
    private auth: AuthService,
    private adminApi: AdminApiService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.load();
  }

  load() {
    forkJoin({
      students: this.adminApi.getStudentApprovals().pipe(
        catchError(() => this.adminApi.getStudents().pipe(catchError(() => of([]))))
      ),
      admins: this.adminApi.getAdmins().pipe(catchError(() => of([])))
    }).subscribe(({ students, admins }) => {
      const normalizedStudents = students.map((student: any) => ({
        ...student,
        name: student.username,
        role: 'student',
        avatar: (student.username || 'ST').substring(0, 2).toUpperCase(),
        joinDate: '—',
        approvalStatus: student.approvalStatus || this.auth.getStudentApprovalStatus(student)
      }));
      const normalizedAdmins = admins.map((admin: any) => ({
        ...admin,
        name: admin.username || `Admin #${admin.id}`,
        email: admin.email || '',
        role: 'admin',
        avatar: 'AD',
        joinDate: '—'
      }));
      this.users = [...normalizedAdmins, ...normalizedStudents];
      this.cdr.detectChanges();
    });
  }

  get filteredUsers() {
    const term = this.filter.toLowerCase().trim();
    if (!term) return this.users;
    return this.users.filter(u =>
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  }

  openCreate() {
    this.isEdit = false;
    this.form = { name: '', email: '', password: '', role: 'student', phone: '' };
    this.formError = '';
    this.showModal = true;
  }

  openEdit(u: any) {
    this.isEdit = true;
    this.editId = u.id;
    this.form = { name: u.name, email: u.email, password: u.password, role: u.role, phone: u.phone || '' };
    this.formError = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.formError = ''; }

  saveUser() {
    if (!this.form.name.trim() || !this.form.email.trim()) { this.formError = 'Name and email are required.'; return; }
    if (!this.isEdit && !this.form.password.trim()) { this.formError = 'Password is required for new users.'; return; }
    try {
      if (this.isEdit) {
        this.auth.updateUser(this.editId!, this.form);
        this.showToast('User updated successfully', 'success');
      } else {
        this.auth.createUser(this.form);
        this.showToast('User created successfully', 'success');
      }
      this.load(); this.closeModal();
    } catch (e: any) { this.formError = e.message; }
  }

  confirmDelete(u: any) { this.deleteTarget = u; }
  cancelDelete() { this.deleteTarget = null; }

  deleteUser() {
    if (!this.deleteTarget) return;
    if (this.deleteTarget.role !== 'student') {
      this.showToast('Only student deletion is supported by this screen.', 'danger');
      this.deleteTarget = null;
      return;
    }
    this.adminApi.deleteStudent(this.deleteTarget.id).pipe(catchError(err => {
      this.showToast(err?.error?.detail || 'Student delete failed', 'danger');
      return of(null);
    })).subscribe(res => {
      if (!res) return;
      this.deleteTarget = null;
      this.load();
      this.showToast('Student deleted', 'danger');
    });
  }

  approveStudent(u: any) {
    this.adminApi.updateStudentApproval(u.id, 'approved').pipe(catchError(err => {
      this.showToast(err?.error?.detail || 'Approval failed. Backend did not update the account.', 'danger');
      return of(null);
    })).subscribe(res => {
      if (!res) return;
      this.auth.setStudentApproval(u, 'approved');
      u.approvalStatus = res.approvalStatus || 'approved';
      if (!res?.email?.sent) this.openApprovalEmail(u, 'approved', res?.email);
      this.showToast(`${u.name} approved`, 'success');
      this.load();
      this.cdr.detectChanges();
    });
  }

  rejectStudent(u: any) {
    this.adminApi.updateStudentApproval(u.id, 'rejected').pipe(catchError(err => {
      this.showToast(err?.error?.detail || 'Reject failed. Backend did not update the account.', 'danger');
      return of(null);
    })).subscribe(res => {
      if (!res) return;
      this.auth.setStudentApproval(u, 'rejected');
      u.approvalStatus = res.approvalStatus || 'rejected';
      if (!res?.email?.sent) this.openApprovalEmail(u, 'rejected', res?.email);
      this.showToast(`${u.name} rejected`, 'danger');
      this.load();
      this.cdr.detectChanges();
    });
  }

  private openApprovalEmail(u: any, status: 'approved' | 'rejected', backendEmail?: any) {
    if (!isPlatformBrowser(this.platformId) || !u.email) return;
    const subject = backendEmail?.subject || (status === 'approved'
      ? 'Your EduBoost account has been approved'
      : 'Your EduBoost account request was rejected');
    const body = backendEmail?.body || (status === 'approved'
      ? `Hello ${u.name},\n\nYour EduBoost account has been approved by the admin. You can now sign in and access your student dashboard.\nSign in here: http://127.0.0.1:4200/login\n\nEduBoost`
      : `Hello ${u.name},\n\nYour EduBoost account request was rejected by the admin.\n\nEduBoost`);
    window.location.href = `mailto:${encodeURIComponent(u.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  showToast(msg: string, type: string) {
    clearTimeout(this.toastTimeout);
    this.toast = { msg, type };
    this.toastTimeout = setTimeout(() => this.toast = null, 3000);
  }

  get totalCount() { return this.users.length; }
  get adminCount() { return this.users.filter(u => u.role === 'admin').length; }
  get studentCount() { return this.users.filter(u => u.role === 'student').length; }
}
