import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // On server side, allow through (Client render mode handles actual auth)
    if (!isPlatformBrowser(this.platformId)) return true;

    const user = this.auth.getCurrentUser();
    if (!user) {
      return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }
    if (user.role === 'admin') return true;
    return this.router.createUrlTree(['/access-denied']);
  }
}
