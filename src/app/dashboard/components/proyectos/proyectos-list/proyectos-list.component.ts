import { Component, OnInit } from '@angular/core';
import { ProyectoService } from '../../../../shared/services/proyecto.service';
import { Proyecto } from '../../../../shared/models';
import { AuthService } from '../../../../shared/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { TareaService } from '../../../../shared/services/tarea.service';

@Component({
  selector: 'app-proyectos-list',
  standalone: false,
  templateUrl: './proyectos-list.component.html',
  styleUrls: ['./proyectos-list.component.css']
})
export class ProyectosListComponent implements OnInit {
  proyectos: Proyecto[] = [];
  proyectosConTareas: any[] = []; 
  proyectosPaginados: Proyecto[] = [];
  isLoading = true;
  currentPage = 1;
  itemsPerPage = 10;

  constructor(
    private proyectoService: ProyectoService,
    private tareaService: TareaService, 
    public authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarProyectos();
  }

  cargarProyectos(): void {
    this.isLoading = true;

    let proyectosObservable: Observable<Proyecto[]>;
    
    if (this.authService.isAdmin()) {
      proyectosObservable = this.proyectoService.obtenerTodosProyectos();
    } else if (this.authService.isEncargado()) {
      proyectosObservable = this.proyectoService.obtenerProyectosPorEncargado();
    } else {
      proyectosObservable = this.proyectoService.obtenerProyectosDondeUsuarioEsAsignado();
    }

    proyectosObservable.subscribe({
      next: (proyectos) => {
        if (this.authService.isEncargado()) {
          const userId = this.authService.currentUserValue?.id;
          this.proyectos = proyectos.filter(p => p.encargadoId === userId);
          
          this.cargarTareasParaProyectos();
        } else {
          this.proyectos = proyectos;
          this.actualizarProyectosPaginados();
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error al cargar proyectos:', error);
        this.toastr.error('Error al cargar los proyectos');
        this.isLoading = false;
      }
    });
  }

 
  cargarTareasParaProyectos(): void {
    this.proyectosConTareas = [];
    
    this.proyectos.forEach(proyecto => {
      this.tareaService.obtenerTareasPorProyecto(proyecto.id).subscribe(tareas => {
        const proyectoConTareas = {
          ...proyecto,
          tareas: tareas,
          tareasPendientes: tareas.filter(t => t.estado === 'Pendiente').length,
          tareasEnProgreso: tareas.filter(t => t.estado === 'En progreso').length,
          tareasCompletadas: tareas.filter(t => t.estado === 'Completada').length
        };
        
        this.proyectosConTareas.push(proyectoConTareas);
        
        
        if (this.proyectosConTareas.length === this.proyectos.length) {
          this.isLoading = false;
        }
      });
    });
  }

  
  actualizarProyectosPaginados(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.proyectosPaginados = this.proyectos.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.actualizarProyectosPaginados();
  }

  getDisplayRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.proyectos.length);
    return `${start} - ${end} de ${this.proyectos.length}`;
  }

  isFechaVencida(fechaLimite: Date | string): boolean {
    const fecha = typeof fechaLimite === 'string' ? new Date(fechaLimite) : fechaLimite;
    const hoy = new Date();
    
    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);
    
    return fecha < hoy;
  }

  async eliminarProyecto(id: number, nombre: string): Promise<void> {
    try {
      let tareasCount = 0;
      
      try {
        tareasCount = await this.proyectoService.obtenerCantidadTareas(id).toPromise() || 0;
      } catch (error) {
        console.error('Error al obtener conteo de tareas:', error);
        tareasCount = 1;
      }
      
      if (tareasCount > 0) {
        Swal.fire(
          'No se puede eliminar',
          `El proyecto "${nombre}" tiene tareas asociadas. Elimina primero las tareas o reasígnalas a otro proyecto.`,
          'error'
        );
        return;
      }

      const result = await Swal.fire({
        title: `¿Estás seguro de eliminar el proyecto "${nombre}"?`,
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'No, cancelar'
      });

      if (result.isConfirmed) {
        await this.proyectoService.eliminarProyecto(id).toPromise();
        this.proyectos = this.proyectos.filter(p => p.id !== id);
        if (this.authService.isEncargado()) {
          this.proyectosConTareas = this.proyectosConTareas.filter(p => p.id !== id);
        } else {
          this.actualizarProyectosPaginados();
        }
        Swal.fire(
          '¡Eliminado!',
          'El proyecto ha sido eliminado correctamente.',
          'success'
        );
      }
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      Swal.fire(
        'Error',
        'Ocurrió un error al eliminar el proyecto',
        'error'
      );
    }
  }
}