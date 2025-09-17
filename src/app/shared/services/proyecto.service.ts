import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Proyecto, ProyectoConTareas, Usuario } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {
  private apiUrl = `${environment.apiUrl}/api/proyectos`;

  constructor(private http: HttpClient) {}

  crearProyecto(proyecto: any): Observable<Proyecto> {
    return this.http.post<Proyecto>(this.apiUrl, proyecto);
  }

  obtenerTodosProyectos(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(this.apiUrl);
  }

  obtenerProyectoPorId(id: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${this.apiUrl}/${id}`);
  }

  actualizarProyecto(id: number, proyecto: any): Observable<Proyecto> {
    return this.http.put<Proyecto>(`${this.apiUrl}/${id}`, proyecto);
  }

  eliminarProyecto(id: number): Observable<void | { error: string, tareasCount: number }> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 400 && error.error) {
          return of(error.error);
        }
        throw error;
      })
    );
  }

obtenerCantidadTareas(proyectoId: number): Observable<number> {
  return this.http.get<number>(`${this.apiUrl}/${proyectoId}/tareas/count`).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 404 || error.status === 500) {
        // Si el endpoint no existe o hay error interno, asumir que hay tareas
        return of(1); // Retornar 1 para prevenir eliminación
      }
      throw error;
    })
  );
}

  obtenerProyectosPorCreador(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${this.apiUrl}/mis-proyectos`);
  }

    obtenerUsuariosEncargados(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios-encargados`);
  }

  // Corregir el nombre del endpoint para proyectos por encargado
  obtenerProyectosPorEncargado(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${this.apiUrl}/proyectos-encargados`);
  }

  asignarEncargados(proyectoId: number, encargadosIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${proyectoId}/encargados`, { encargadosIds });
  }

  obtenerEncargados(proyectoId: number): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/${proyectoId}/encargados`);
  }

    obtenerProyectosDondeUsuarioEsAsignado(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${this.apiUrl}/mis-proyectos-asignado`);
  }

  // Para asignar un encargado
asignarEncargado(proyectoId: number, encargadoId: number): Observable<Proyecto> {
  return this.http.post<Proyecto>(`${this.apiUrl}/${proyectoId}/encargados`, { encargadoId });
}
obtenerEncargado(proyectoId: number): Observable<Usuario> {
  return this.http.get<Usuario>(`${this.apiUrl}/${proyectoId}/encargados`);
}

  obtenerTodosProyectosConTareas(): Observable<ProyectoConTareas[]> {
    return this.http.get<ProyectoConTareas[]>(`${this.apiUrl}/proyectos-con-tareas`);
  }

  obtenerProyectosConTareasPorEncargado(): Observable<ProyectoConTareas[]> {
    return this.http.get<ProyectoConTareas[]>(`${this.apiUrl}/proyectos-con-tareas-encargado`);
  }

  obtenerProyectosConTareasDondeUsuarioEsAsignado(): Observable<ProyectoConTareas[]> {
    return this.http.get<ProyectoConTareas[]>(`${this.apiUrl}/proyectos-con-tareas-asignados`);
  }
}