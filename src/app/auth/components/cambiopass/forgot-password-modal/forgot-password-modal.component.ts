import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import Swal from 'sweetalert2';
import { AuthService } from '../../../../shared/services/auth.service';

@Component({
  selector: 'app-forgot-password-modal',
  standalone: false,
  templateUrl: './forgot-password-modal.component.html',
  styleUrl: './forgot-password-modal.component.css'
})
export class ForgotPasswordModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  passwordForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.passwordForm = this.fb.group({
      username: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }


  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword')?.value;
    const confirm = form.get('confirmPassword')?.value;
    
    if (password && confirm && password !== confirm) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
    } else {
      form.get('confirmPassword')?.setErrors(null);
    }
    return null;
  }

  togglePasswordVisibility(field: string): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      

      if (this.passwordForm.errors?.['mismatch']) {
        Swal.fire({
          title: 'Error',
          text: 'Las contraseñas no coinciden',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
      return;
    }

    this.isLoading = true;
    const { username, newPassword, confirmPassword } = this.passwordForm.value;

    this.authService.cambiarPassword({ 
      username, 
      currentPassword: '', 
      nuevaPassword: newPassword,
      confirmacionPassword: confirmPassword 
    }).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Éxito!',
          text: 'Contraseña cambiada correctamente',
          icon: 'success',
          confirmButtonText: 'Entendido'
        });
        this.closeModal.emit();
      },
      error: (err) => {
        this.isLoading = false;
        let errorMessage = 'Error al cambiar la contraseña';
        
        if (err.status === 404) {
          errorMessage = 'Usuario no encontrado';
        } else if (err.error?.mensaje) {
          errorMessage = err.error.mensaje;
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }

        Swal.fire({
          title: 'Error',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }
}