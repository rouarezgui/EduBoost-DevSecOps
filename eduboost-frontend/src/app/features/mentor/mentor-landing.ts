import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mentor-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="mentor-hero">
      <div class="mentor-hero-inner">
        <div class="mentor-copy">
          <h1>Inspiring Excellence Through Education</h1>
          <p class="lead">Discover courses, trainers and learning paths crafted for your success.</p>
          <div class="cta-row">
            <a routerLink="/login" class="btn btn-primary btn-lg">Get Started</a>
            <a routerLink="/catalog" class="btn btn-outline-light btn-lg">Explore Courses</a>
          </div>
        </div>
        <div class="mentor-image" [style.background-image]="'url(/Mentor/assets/img/hero-bg.jpg)'"></div>
      </div>
    </div>
  `,
  styles: [
    `:host{display:block}.mentor-hero{background:linear-gradient(90deg,#eef7f9,#f8fbfc);padding:48px 16px}.mentor-hero-inner{max-width:1100px;margin:0 auto;display:flex;gap:20px;align-items:center}.mentor-copy{flex:1}.mentor-copy h1{font-size:40px;margin:0 0 12px;color:#06313a}.mentor-copy .lead{color:#37585f;margin-bottom:18px}.cta-row{display:flex;gap:12px}.mentor-image{width:420px;height:260px;background-size:cover;background-position:center;border-radius:12px;box-shadow:0 12px 30px rgba(2,6,23,0.06)}@media(max-width:800px){.mentor-hero-inner{flex-direction:column}.mentor-image{width:100%;height:200px}}`
  ]
})
export default class MentorLandingComponent {}
