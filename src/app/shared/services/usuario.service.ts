import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/api/usuarios`;

  constructor(private http: HttpClient) { }

  obtenerTodosUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  obtenerUsuarioPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  actualizarUsuario(id: number, usuario: any): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { observe: 'response' }).pipe(
      map(response => {
        if (response.status === 200) {
          return response.body;
        }
        throw response;
      }),
      catchError((error: any) => {
        console.log('Error completo:', error);

        let errorMessage = 'Error al eliminar usuario';
        if (error.error && typeof error.error === 'object' && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        throw new Error(errorMessage);
      })
    );
  }

  verificarAsignacionesUsuario(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/verificar-asignaciones`);
  }

  obtenerConteoAsignaciones(id: number): Observable<{ tareas: number, proyectos: number }> {
    return this.http.get<{ tareas: number, proyectos: number }>(`${this.apiUrl}/${id}/conteo-asignaciones`);
  }

  cambiarRolUsuario(usuarioId: number, rol: string): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${usuarioId}/rol?rol=${rol}`, {});
  }

  cambiarPassword(cambioPassword: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/cambiar-password`, cambioPassword);
  }

  obtenerUsuariosPorRol(rol: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/por-rol`, {
      params: { rol }
    });
  }


}