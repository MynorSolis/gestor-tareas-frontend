import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ForgotPasswordModalComponent } from '../cambiopass/forgot-password-modal/forgot-password-modal.component';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  loginError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private modalService: NgbModal
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    
    this.loginForm.valueChanges.subscribe(() => {
      if (this.loginError) {
        this.loginError = null;
        
        this.loginForm.get('username')?.setErrors(null);
        this.loginForm.get('password')?.setErrors(null);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.loginError = null;
    
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const loginRequest = this.loginForm.value;

    this.authService.login(loginRequest).subscribe({
      next: (user) => {
        this.router.navigate(['/dashboard']);
        this.isLoading = false;
        
        Swal.fire({
          title: `¡Bienvenido ${user.username}!`,
          text: 'Has iniciado sesión correctamente',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
          background: '#f8f9fa',
          iconColor: '#28a745'
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.loginError = 'Usuario o contraseña incorrectos';
      }
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  openForgotPasswordModal(event: Event): void {
    event.preventDefault();
    const modalRef = this.modalService.open(ForgotPasswordModalComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
    
    modalRef.componentInstance.closeModal.subscribe(() => {
      modalRef.close();
    });
  }
}