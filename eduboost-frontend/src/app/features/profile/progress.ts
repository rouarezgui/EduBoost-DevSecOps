import { Component , PLATFORM_ID, Inject} from '@angular/core';
import { CommonModule , isPlatformBrowser} from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { CourseService } from '../../core/services/course.service';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress.html',
  styleUrls: ['./progress.css']
})
export class ProgressComponent {
  progress: any[] = [];
  user: any = null;
  constructor(private auth: AuthService, private cs: CourseService, @Inject(PLATFORM_ID) private platformId: Object){
    this.user = this.auth.getCurrentUser();
    if(this.user){
      const courses = this.cs.list();
      this.progress = courses.map((c: any) => ({
        course: c.title,
        stats: this.cs.getProgressForUserCourse(this.user.id, c.id),
        risk: this.cs.calcRisk(this.cs.getProgressForUserCourse(this.user.id, c.id).progress),
        rec: this.cs.recommendationFor(this.cs.getProgressForUserCourse(this.user.id, c.id).progress)
      }));
    }
  }
}
