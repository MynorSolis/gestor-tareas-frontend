import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  success(message: string, title = '¡Éxito!'): void {
    Swal.fire({
      title,
      text: message,
      icon: 'success',
      timer: 4000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      background: '#f8f9fa',
      iconColor: '#28a745'
    });
  }

  error(message: string, title = 'Error'): void {
    Swal.fire({
      title,
      text: message,
      icon: 'error',
      confirmButtonText: 'Entendido'
    });
  }

  info(message: string, title = 'Información'): void {
    Swal.fire({
      title,
      text: message,
      icon: 'info',
      timer: 4000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      background: '#f8f9fa',
      iconColor: '#17a2b8'
    });
  }

  confirm(title: string, text: string, confirmText: string = 'Confirmar', cancelText: string = 'Cancelar'): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true
    });
  }
}