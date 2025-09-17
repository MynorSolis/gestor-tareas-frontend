import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

interface MenuItem {
  title: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: 'home',
      route: '/dashboard',
      roles: ['ROLE_USER', 'ROLE_ENCARGADO', 'ROLE_ADMIN']
    },
    {
      title: 'Tareas',
      icon: 'list',
      route: '/dashboard/tareas',
      roles: ['ROLE_USER', 'ROLE_ENCARGADO', 'ROLE_ADMIN']
    },
    {
      title: 'Proyectos',
      icon: 'folder',
      route: '/dashboard/proyectos',
      roles: ['ROLE_ENCARGADO', 'ROLE_ADMIN']
    },
    {
      title: 'Usuarios',
      icon: 'users',
      route: '/dashboard/usuarios',
      roles: ['ROLE_ADMIN']
    }
  ];

  filteredMenuItems: MenuItem[] = [];
  sidebarVisible = false;
  isMobileView = false;
  private resizeSubscription: Subscription;

  constructor(
    public authService: AuthService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.resizeSubscription = this.breakpointObserver.observe([
      '(max-width: 991.98px)'
    ]).subscribe(result => {
      this.isMobileView = result.matches;
      if (!this.isMobileView) {
        this.sidebarVisible = true;
      } else {
        this.sidebarVisible = false;
      }
    });
  }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.filteredMenuItems = this.menuItems.filter(item =>
          item.roles.some(role => user.roles.includes(role))
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.resizeSubscription.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebarOnMobile(): void {
    if (this.isMobileView) {
      this.sidebarVisible = false;
    }
  }

  isTareasItem(item: MenuItem): boolean {
    return item.title === 'Tareas';
  }


  isProyectosItem(item: MenuItem): boolean {
    return item.title === 'Proyectos';
  }

}