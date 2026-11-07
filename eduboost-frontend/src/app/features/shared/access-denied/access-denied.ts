import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container text-center mt-5">
      <h2>Access denied</h2>
      <p class="text-muted">Vous n'avez pas la permission d'accéder à cette page.</p>
      <a class="btn btn-primary" routerLink="/dashboard">Retour au tableau de bord</a>
    </div>
  `
})
export class AccessDeniedComponent {
  constructor(private router: Router) {}
}
