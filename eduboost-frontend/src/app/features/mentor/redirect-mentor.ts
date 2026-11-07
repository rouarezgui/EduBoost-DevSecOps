import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-mentor-redirect',
  standalone: true,
  template: `<p>Redirecting to Mentor template...</p>`
})
export default class MentorRedirectComponent implements OnInit{
  ngOnInit(): void {
    // Redirect the browser to the static Mentor index page
    window.location.href = '/Mentor/index.html';
  }
}
