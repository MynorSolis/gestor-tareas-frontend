import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    const expectedRoles = next.data['roles'] as Array<string>;
    const userRoles = this.authService.getUserRoles();

    if (this.authService.isLoggedIn() && expectedRoles.some(role => userRoles.includes(role))) {
      return true;
    }

    this.toastr.error('No tienes permisos para acceder a esta página');
    this.router.navigate(['/dashboard']);
    return false;
  }
}