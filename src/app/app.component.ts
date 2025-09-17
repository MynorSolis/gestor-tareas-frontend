import { Component, ViewChild } from '@angular/core';
import { AuthService } from './shared/services/auth.service';
import { Router } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  showNavbarAndSidebar(): boolean {
    return this.authService.isLoggedIn() && !this.isPublicRoute();
  }

  private isPublicRoute(): boolean {

    const publicRoutes = ['/auth/login', '/auth/registro', '/auth'];
    return publicRoutes.some(route => this.router.url.includes(route));
  }

  toggleSidebar(): void {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
    }
  }
}
