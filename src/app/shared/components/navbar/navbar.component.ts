import { Component, OnInit, ViewChild, TemplateRef, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../models';
import { ToastrService } from 'ngx-toastr';
import { NgbModal, NgbDropdown } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  @ViewChild('editProfileModal') editProfileModal!: TemplateRef<any>;
  @ViewChild(NgbDropdown) dropdown!: NgbDropdown;
  @Output() sidebarToggled = new EventEmitter<void>()

  currentUser: Usuario | null = null;
  editUserData: any = {};

  constructor(
    public authService: AuthService,
    private usuarioService: UsuarioService,
    private router: Router,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.currentUser = this.authService.currentUserValue;
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.editUserData = {
          username: user.username,
          email: user.email
        };
      }
    });
  }

  getRoleName(role?: string): string {
    if (!role) return 'Usuario';
    const roleNames: {[key: string]: string} = {
      'ROLE_USER': 'Usuario',
      'ROLE_ENCARGADO': 'Encargado',
      'ROLE_ADMIN': 'Administrador'
    };
    return roleNames[role] || role.replace('ROLE_', '');
  }

  logout(): void {
    this.authService.logout();
    this.dropdown.close();
    this.router.navigate(['/login']);
  }

  toggleEditModal(): void {
    this.dropdown.close();
    this.router.navigate(['/dashboard/perfil']);
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  onModalClosed(): void {
    if (this.currentUser) {
      this.editUserData = {
        username: this.currentUser.username,
        email: this.currentUser.email
      };
    }
  }

  updateUser(): void {
    if (!this.currentUser) return;

    this.usuarioService.actualizarUsuario(this.currentUser.id, this.editUserData)
      .subscribe({
        next: (updatedUser) => {
          this.toastr.success('Datos actualizados correctamente');
          this.authService.refreshCurrentUser();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error actualizando usuario:', err);
          this.toastr.error(err.error?.message || 'Error al actualizar los datos');
        }
      });
  }

  toggleSidebar(): void {
    this.sidebarToggled.emit();
  }
}