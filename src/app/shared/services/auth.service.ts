import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, take, switchMap, tap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { jwtDecode as jwt_decode } from 'jwt-decode';

import { environment } from '../../../environments/environment';
import { LoginRequest, Proyecto, RegistroRequest, Tarea, Usuario } from '../models';
import { ProyectoService } from './proyecto.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private currentUserSubject: BehaviorSubject<Usuario | null>;
  public currentUser: Observable<Usuario | null>;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService,
    private proyectoService: ProyectoService
  ) {

    const savedUser = localStorage.getItem('userData');
    const initialUser = savedUser ? JSON.parse(savedUser) : this.getUserFromToken();

    this.currentUserSubject = new BehaviorSubject<Usuario | null>(initialUser);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): Usuario | null {
    return this.currentUserSubject.value;
  }

  login(loginRequest: LoginRequest): Observable<Usuario> {
    return this.http.post<any>(`${this.apiUrl}/login`, loginRequest).pipe(
      map(response => {
        if (!response?.token) {
          throw new Error('La respuesta del servidor no contiene token');
        }

        const user: Usuario = {
          id: response.id,
          username: response.username,
          nombre: response.nombre || null,
          apellido: response.apellido || null,
          email: response.email || '',
          roles: this.normalizeRoles(response.roles)
        };

        this.setAuthData(response.token, user);
        return user;
      }),
      catchError(error => {
        let errorMessage = 'Usuario o contraseña incorrectos';
        if (error.status === 0) {
          errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
        } else if (error.status >= 500) {
          errorMessage = 'Error del servidor. Por favor intenta más tarde.';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  register(registroRequest: RegistroRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, registroRequest).pipe(
      map(response => {
        this.toastr.success('Registro exitoso. Por favor inicia sesión.');
        return response;
      }),
      catchError(error => {
        this.toastr.error(error.error?.message || 'Error al registrar usuario');
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/auth/login']);
    this.toastr.info('Sesión cerrada');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded: any = jwt_decode(token);
      return decoded.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserRoles(): string[] {
    const user = this.currentUserValue;
    return user ? user.roles : [];
  }

  isAdmin(): boolean {
    return this.getUserRoles().includes('ROLE_ADMIN');
  }

  isEncargado(): boolean {
    return this.getUserRoles().includes('ROLE_ENCARGADO');
  }

  isUser(): boolean {
    return this.getUserRoles().includes('ROLE_USER');
  }

  refreshCurrentUser(): Observable<Usuario> {
    return this.getUsuarioActual().pipe(
      tap(user => {
        this.setAuthData(this.getToken() || '', user);
      })
    );
  }

  cambiarPassword(cambioRequest: {
    username?: string,
    currentPassword: string,
    nuevaPassword: string,
    confirmacionPassword: string
  }): Observable<any> {
    const currentUser = this.currentUserValue;
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const requestData = {
      username: cambioRequest.username || currentUser.username,
      currentPassword: cambioRequest.currentPassword,
      nuevaPassword: cambioRequest.nuevaPassword,
      confirmacionPassword: cambioRequest.confirmacionPassword
    };

    return this.http.post(`${this.apiUrl}/cambiar-password`, requestData).pipe(
      tap(() => {
        this.toastr.success('Contraseña cambiada correctamente');
      }),
      catchError(error => {
        console.error('Error al cambiar contraseña:', error);
        this.toastr.error(error.error?.message || 'Error al cambiar la contraseña');
        return throwError(() => error);
      })
    );
  }

  actualizarPerfil(userData: any): Observable<Usuario> {
    const currentUser = this.currentUserValue;
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http.put<Usuario>(`${environment.apiUrl}/api/usuarios/${currentUser.id}`, userData).pipe(
      tap((updatedUser: Usuario) => {
        this.setAuthData(this.getToken() || '', updatedUser);
        this.toastr.success('Perfil actualizado correctamente');
      }),
      catchError(error => {
        console.error('Error al actualizar perfil:', error);
        this.toastr.error(error.error?.message || 'Error al actualizar el perfil');
        return throwError(() => error);
      })
    );
  }

  getUsuarioActual(): Observable<Usuario> {
    const currentUser = this.currentUserValue;
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http.get<Usuario>(`${environment.apiUrl}/api/usuarios/${currentUser.id}`).pipe(
      tap(user => {
        this.setAuthData(this.getToken() || '', user);
      })
    );
  }

  private setAuthData(token: string, user: Usuario): void {
    localStorage.setItem('token', token);
    localStorage.setItem('userData', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    this.currentUserSubject.next(null);
  }

  private getUserFromToken(): Usuario | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded: any = jwt_decode(token);
      return {
        id: decoded.id || 0,
        username: decoded.sub || '',
        nombre: decoded.nombre || null,
        apellido: decoded.apellido || null,
        email: decoded.email || '',
        roles: this.normalizeRoles(decoded.roles)
      };
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }

  private normalizeRoles(roles: any): string[] {
    if (!roles) return [];
    if (typeof roles === 'string') return [roles];
    if (Array.isArray(roles)) return roles;
    return [];
  }


  canEditProject(proyecto: Proyecto): boolean {
    if (!this.currentUserValue) return false;
    if (this.isAdmin()) return true;

    return this.isEncargado() &&
      (proyecto.encargadoId === this.currentUserValue?.id ||
        proyecto.creadorId === this.currentUserValue.id);
  }

  canDeleteProject(): boolean {
    return this.isAdmin();
  }

  canEditTask(tarea: Tarea): boolean {
    const currentUser = this.currentUserValue;
    if (!currentUser) {
      return false;
    }
    if (this.isAdmin()) {
      return true;
    }

    if (this.isEncargado()) {
      const isEncargado = tarea.encargadoProyecto?.id === currentUser.id;
      return isEncargado;
    }

    const isAsignado = tarea.usuarioAsignadoId === currentUser.id;
    return isAsignado;
  }

  canDeleteTask(tarea: Tarea): boolean {
    return this.canEditTask(tarea);
  }
}