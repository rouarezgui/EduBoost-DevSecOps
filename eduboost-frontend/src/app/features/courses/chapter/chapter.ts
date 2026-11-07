import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CourseService } from '../../../core/services/course.service';
import { ProgressApiService } from '../../../core/services/progress-api.service';
import { CoursesApiService } from '../../../core/services/courses-api.service';
import { LearningApiService } from '../../../core/services/learning-api.service';

@Component({
  selector: 'app-chapter',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './chapter.html',
  styleUrls: ['./chapter.css']
})
export class ChapterComponent implements OnInit, OnDestroy {
  course:       any = null;
  chapter:      any = null;
  courseId:     number = 0;
  chapterIndex: number = 0;
  videoUrl:     SafeResourceUrl | null = null;
  videoPlaying  = false;

  private sub!: Subscription;

  private videoMap: Record<number, Record<number, string>> = {
    1: { 1:'ORueTGEP-jg', 2:'NybHckSEQBI', 3:'XGeXQS2QQAA', 4:'WUvTyaaNkzM' },
    2: { 1:'l1mER1bV0N0', 2:'JJSoEo8JSnc', 3:'EiNiSFIPIQE', 4:'SgmNxE9lWcY', 5:'yU7jJ3NbPdA' },
    3: { 1:'kqtD5dpn9C8', 2:'_uQrJ0TkZlc', 3:'u-OmVr_fT4s', 4:'W8KRzm-HUcc', 5:'JeznW_7DlB0', 6:'Uh2ebFW8OO0' },
    4: { 1:'vmEHCJofslg', 2:'a9UrKTVEeZA', 3:'oBU7PFdD_04', 4:'i_LwzRVP7bg' },
    5: { 1:'CzxGXFEt0_E', 2:'JNOXZumCXNM', 3:'sJYUhSGvs-E' },
    6: { 1:'hF515-0Tduk', 2:'nMBRHT2Z8WY', 3:'Q0hi2X84h2g', 4:'i4pqMIDOFIo' },
  };

  constructor(
    private route:       ActivatedRoute,
    private router:      Router,
    private cs:          CourseService,
    private progressApi: ProgressApiService,
    private coursesApi:  CoursesApiService,
    private learningApi: LearningApiService,
    private location:    Location,
    private sanitizer:   DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.sub = this.route.paramMap.subscribe(params => {
      const courseId  = Number(params.get('courseId'));
      const chapterId = Number(params.get('chapterId'));

      this.courseId     = courseId;
      this.course       = this.cs.getCourse(courseId);
      this.videoPlaying = false;
      this.videoUrl     = null;

      if (this.course) {
        const idx = (this.course.chapters || []).findIndex((c: any) => c.id == chapterId);
        this.chapterIndex = idx >= 0 ? idx : 0;
        this.chapter      = this.course.chapters?.[this.chapterIndex] || null;
      } else {
        this.chapter = null;
      }

      // Track progress via backend
      if (isPlatformBrowser(this.platformId)) {
        this.progressApi.createProgress({ course_id: courseId, chapter_id: chapterId })
          .pipe(catchError(() => of(null)))
          .subscribe();
        this.learningApi.trackEvent({ action: 'chapter_view', course_id: courseId, chapter_id: chapterId, progress: 20 })
          .pipe(catchError(() => of(null)))
          .subscribe();
      }
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  goToChapter(ch: any) {
    this.router.navigate(['/courses', this.courseId, 'chapters', ch.id]);
  }

  playVideo() {
    if (!isPlatformBrowser(this.platformId)) return;
    const vid = this.videoMap[this.courseId]?.[this.chapter?.id];
    if (vid) {
      this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1`
      );
    }
    this.videoPlaying = true;
    this.learningApi.trackEvent({ action: 'video_play', course_id: this.courseId, chapter_id: this.chapter?.id, progress: 10 })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  get videoId(): string | null {
    return this.videoMap[this.courseId]?.[this.chapter?.id] || null;
  }

  get prevChapter(): any { return this.course?.chapters?.[this.chapterIndex - 1] || null; }
  get nextChapter():  any { return this.course?.chapters?.[this.chapterIndex + 1] || null; }

  goBack() { this.location.back(); }
}
