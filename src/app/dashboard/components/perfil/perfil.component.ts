import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../shared/services/auth.service';
import { UsuarioService } from '../../../shared/services/usuario.service';
import { Usuario } from '../../../shared/models';
import { AlertService } from '../../../shared/services/alert.service';


@Component({
  selector: 'app-perfil',
  standalone: false,
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit {
  usuario: Usuario | null = null;
  perfilForm: FormGroup;
  originalData: any;
  isFormChanged = false;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private fb: FormBuilder,
    private alertService: AlertService,
    private modalService: NgbModal
  ) {
    this.perfilForm = this.fb.group({
      username: ['', [Validators.required, Validators.maxLength(20)]],
      nombre: ['', [Validators.maxLength(50)]],
      apellido: ['', [Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.perfilForm.valueChanges.subscribe(() => {
      this.checkFormChanges();
    });
  }

  loadUserData(): void {
    this.usuario = this.authService.currentUserValue;
    if (this.usuario) {
      this.perfilForm.patchValue({
        username: this.usuario.username,
        nombre: this.usuario.nombre || '',
        apellido: this.usuario.apellido || '',
        email: this.usuario.email
      });
      this.originalData = this.perfilForm.value;
    }
  }

  checkFormChanges(): void {
    this.isFormChanged = JSON.stringify(this.perfilForm.value) !== JSON.stringify(this.originalData);
  }

  onSubmit(): void {
    if (this.perfilForm.invalid || !this.usuario) return;

    this.isLoading = true;
    const formData = this.perfilForm.value;
    const currentUser = this.usuario;

    this.usuarioService.actualizarUsuario(currentUser.id, formData).subscribe({
      next: (updatedUser) => {
        this.alertService.success('Perfil actualizado correctamente');
        
        const updatedUserData = {
          ...currentUser,
          ...updatedUser,
          nombre: updatedUser.nombre ?? currentUser.nombre,
          apellido: updatedUser.apellido ?? currentUser.apellido
        };
        
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        this.authService.refreshCurrentUser();
        
        this.usuario = updatedUserData;
        this.originalData = { ...this.perfilForm.value };
        this.isFormChanged = false;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.alertService.error(err.error?.message || 'Error al actualizar el perfil');
        this.isLoading = false;
      }
    });
  }

  openChangePasswordModal(content: any): void {
    this.modalService.open(content, { centered: true, size: 'md' });
  }

  onChangePassword(currentPassword: string, newPassword: string, confirmPassword: string): void {
    if (newPassword !== confirmPassword) {
      this.alertService.error('Las contraseñas no coinciden');
      return;
    }

    if (!this.usuario) return;

    this.isLoading = true;
    
    this.authService.cambiarPassword({
      currentPassword,
      nuevaPassword: newPassword,
      confirmacionPassword: confirmPassword 
    }).subscribe({
      next: () => {
        this.alertService.success('Contraseña cambiada correctamente');
        this.modalService.dismissAll();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cambiar contraseña:', err);
        this.alertService.error(err.error?.message || 'Error al cambiar la contraseña');
        this.isLoading = false;
      }
    });
  }
}