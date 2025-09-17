import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ArchivoTarea, Comentario, Tarea } from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TareaService {

  private apiUrl = `${environment.apiUrl}/api/tareas`;

  constructor(private http: HttpClient,
    private AuthService: AuthService
  ) { }

  crearTarea(tarea: any): Observable<Tarea> {
    return this.http.post<Tarea>(this.apiUrl, tarea);
  }

  obtenerTodasTareas(): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(this.apiUrl);
  }

  obtenerTareaPorId(id: number): Observable<Tarea> {
    return this.http.get<Tarea>(`${this.apiUrl}/${id}`).pipe(
      map(tarea => ({
        ...tarea,
        fechaCreacion: new Date(tarea.fechaCreacion),
        fechaLimite: new Date(tarea.fechaLimite)
      }))
    );
  }
  actualizarTarea(id: number, tarea: any): Observable<Tarea> {
    const currentUser = this.AuthService.currentUserValue;

    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http.put<Tarea>(`${this.apiUrl}/${id}`, tarea).pipe(
      catchError(error => {
        if (error.status === 403) {
          throw new Error('No tienes permiso para editar esta tarea');
        }
        throw new Error(error.error?.message || 'Error al actualizar la tarea');
      })
    );
  }

  eliminarTarea(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        if (error.status === 403) {
          throw new Error('No tienes permiso para eliminar esta tarea');
        }
        throw error;
      })
    );
  }
  obtenerTareasPorProyecto(proyectoId: number): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.apiUrl}/proyecto/${proyectoId}`);
  }

  obtenerTareasPorUsuarioAsignado(): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.apiUrl}/mis-tareas`);
  }

  actualizarEstadoTarea(id: number, estado: string): Observable<Tarea> {
    return this.http.put<Tarea>(`${this.apiUrl}/${id}/estado?estado=${estado}`, {});
  }

  obtenerTareasPorCreador(): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.apiUrl}/mis-tareas-creadas`);
  }



  obtenerTareasPorProyectos(proyectoIds: number[]): Observable<Tarea[]> {
    return this.http.post<Tarea[]>(`${this.apiUrl}/por-proyectos`, proyectoIds);
  }

  obtenerTareasPorEncargado(): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.apiUrl}/por-encargado`);
  }

  //MÉTODOS PARA COMENTARIOS Y ARCHIVOS
  obtenerComentariosPorTarea(tareaId: number): Observable<Comentario[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/comentarios/tarea/${tareaId}`).pipe(
      map(comentarios => comentarios.map(comentario => ({
        ...comentario,
        fechaCreacion: comentario.fechaCreacion
      }) as Comentario))
    );
  }

  agregarComentario(comentarioRequest: { texto: string; tareaId: number }): Observable<Comentario> {
    return this.http.post<any>(`${environment.apiUrl}/api/comentarios`, comentarioRequest).pipe(
      map(comentario => ({
        ...comentario,
        fechaCreacion: comentario.fechaCreacion
      }) as Comentario)
    );
  }

  eliminarComentario(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/comentarios/${id}`);
  }

  obtenerArchivosPorTarea(tareaId: number): Observable<ArchivoTarea[]> {
    return this.http.get<ArchivoTarea[]>(`${environment.apiUrl}/api/archivos/tarea/${tareaId}`).pipe(
      map(archivos => archivos.map(archivo => ({
        ...archivo,
        fechaSubida: archivo.fechaSubida
      })))
    );
  }

  subirArchivo(tareaId: number, archivo: File): Observable<ArchivoTarea> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('tareaId', tareaId.toString());

    return this.http.post<ArchivoTarea>(`${environment.apiUrl}/api/archivos/subir`, formData).pipe(
      map(archivo => ({
        ...archivo,
        fechaSubida: archivo.fechaSubida
      }))
    );
  }

  eliminarArchivo(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/api/archivos/${id}`);
  }

  descargarArchivo(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/api/archivos/${id}/descargar`, {
      responseType: 'blob'
    });
  }
}


