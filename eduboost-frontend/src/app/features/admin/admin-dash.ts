import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { AdminApiService } from '../../core/services/admin-api.service';
import { CoursesApiService } from '../../core/services/courses-api.service';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-admin-dash',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dash.html',
  styleUrls: ['./admin-dash.css']
})
export default class AdminDashComponent implements OnInit {
  userName = 'Admin';
  recentUsers: any[] = [];
  users: any[] = [];
  stats: any[] = [
    { icon: 'users', color: 'blue', value: 0, label: 'Total Users', sub: 'Students and admins', trend: '' },
    { icon: 'book', color: 'purple', value: 0, label: 'Total Courses', sub: 'Published content', trend: '' },
    { icon: 'graduation', color: 'blue', value: 0, label: 'Students', sub: 'Registered learners', trend: '' },
  ];

  constructor(
    private auth: AuthService,
    private adminApi: AdminApiService,
    private coursesApi: CoursesApiService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const user = this.auth.getCurrentUser();
    if (user) this.userName = user.name || 'Admin';

    forkJoin({
      students: this.adminApi.getStudentApprovals().pipe(
        catchError(() => this.adminApi.getStudents().pipe(catchError(() => of([]))))
      ),
      admins: this.adminApi.getAdmins().pipe(catchError(() => of([]))),
      courses: this.coursesApi.getCourses().pipe(catchError(() => of([])))
    }).subscribe(({ students, admins, courses }) => {
      const normalizedStudents = students.map((student: any) => ({
        ...student,
        name: student.username || student.email || `Student #${student.id}`,
        role: 'student',
        avatar: (student.username || student.email || 'ST').substring(0, 2).toUpperCase(),
        approvalStatus: student.approvalStatus || this.auth.getStudentApprovalStatus(student)
      }));
      const normalizedAdmins = admins.map((admin: any) => ({
        ...admin,
        name: admin.username || admin.email || `Admin #${admin.id}`,
        role: 'admin',
        avatar: 'AD',
        approvalStatus: 'approved'
      }));
      this.users = [...normalizedStudents, ...normalizedAdmins].slice(0, 8);
      this.stats = [
        { icon: 'users', color: 'blue', value: students.length + admins.length, label: 'Total Users', sub: 'Students and admins', trend: '' },
        { icon: 'book', color: 'purple', value: courses.length, label: 'Total Courses', sub: 'Published content', trend: '' },
        { icon: 'graduation', color: 'blue', value: students.length, label: 'Students', sub: 'Registered learners', trend: '' },
      ];
      this.recentUsers = [];
      this.cdr.detectChanges();
    });
  }
}
