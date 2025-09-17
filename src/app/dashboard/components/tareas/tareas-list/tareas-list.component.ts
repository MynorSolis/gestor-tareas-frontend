import { Component, OnInit } from '@angular/core';
import { TareaService } from '../../../../shared/services/tarea.service';
import { EstadoTarea, Tarea } from '../../../../shared/models';
import { AuthService } from '../../../../shared/services/auth.service';
import { ProyectoService } from '../../../../shared/services/proyecto.service';
import { AlertService } from '../../../../shared/services/alert.service';
import { catchError, filter, forkJoin, map, Observable, of, take } from 'rxjs';
import Swal from 'sweetalert2';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-tareas-list',
  standalone: false,
  templateUrl: './tareas-list.component.html',
  styleUrls: ['./tareas-list.component.css']
})
export class TareasListComponent implements OnInit {
  tareas: Tarea[] = [];
  tareasAsignadas: Tarea[] = [];
  tareasProyectosAsignados: Tarea[] = [];
  isLoading = true;
  filtroEstado: EstadoTarea | 'todas' = 'todas';
  isDeleting: number | null = null;

  currentPage = 1;
  itemsPerPage = 10;


  constructor(
    private tareaService: TareaService,
    public authService: AuthService,
    private proyectoService: ProyectoService,
    private alertService: AlertService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      take(1)
    ).subscribe(() => {
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras?.state?.['shouldReload']) {
        this.cargarTareas();
      }
    });


    this.cargarTareas();
  }

  cargarTareas(): void {
    this.isLoading = true;

    if (this.authService.isAdmin()) {
      this.tareaService.obtenerTodasTareas().subscribe({
        next: (tareas) => {
          this.cargarEncargadosDeProyectos(tareas).subscribe({
            next: (tareasConEncargados) => {
              this.tareas = tareasConEncargados;
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Error al cargar encargados para admin:', err);
              this.alertService.error('Error al cargar los datos de los encargados');
              this.isLoading = false;
            }
          });
        },
        error: (err) => {
          console.error('Error al cargar tareas para admin:', err);
          this.alertService.error('Error al cargar las tareas');
          this.isLoading = false;
        }
      });
    } else if (this.authService.isEncargado()) {
      this.proyectoService.obtenerProyectosPorEncargado().subscribe({
        next: (proyectosEncargado) => {
          const proyectosIds = proyectosEncargado.map(p => p.id);

          this.tareaService.obtenerTareasPorEncargado().subscribe({
            next: (tareasEncargado) => {
              this.tareasAsignadas = tareasEncargado.filter(t =>
                t.usuarioAsignadoId === this.authService.currentUserValue?.id
              );

              this.tareasProyectosAsignados = tareasEncargado.filter(t =>
                !this.tareasAsignadas.some(ta => ta.id === t.id) &&
                proyectosIds.includes(t.proyectoId)
              );

              const todasTareas = [...this.tareasAsignadas, ...this.tareasProyectosAsignados];
              this.cargarEncargadosDeProyectos(todasTareas).subscribe({
                next: (tareasConEncargados) => {
                  this.tareas = tareasConEncargados;

                  this.tareasAsignadas = tareasConEncargados.filter(t =>
                    t.usuarioAsignadoId === this.authService.currentUserValue?.id
                  );
                  this.tareasProyectosAsignados = tareasConEncargados.filter(t =>
                    !this.tareasAsignadas.some(ta => ta.id === t.id) &&
                    proyectosIds.includes(t.proyectoId)
                  );
                  this.isLoading = false;
                },
                error: (err) => {
                  console.error('Error al cargar encargados para encargado:', err);
                  this.alertService.error('Error al cargar los datos de los encargados');
                  this.isLoading = false;
                }
              });
            },
            error: (err) => {
              console.error('Error al cargar tareas para encargado:', err);
              this.alertService.error('Error al cargar las tareas del encargado');
              this.isLoading = false;
            }
          });
        },
        error: (err) => {
          console.error('Error al cargar proyectos del encargado:', err);
          this.alertService.error('Error al cargar los proyectos del encargado');
          this.isLoading = false;
        }
      });
    } else {
      this.tareaService.obtenerTareasPorUsuarioAsignado().subscribe({
        next: (tareas) => {
          this.cargarEncargadosDeProyectos(tareas).subscribe({
            next: (tareasConEncargados) => {
              this.tareas = tareasConEncargados;
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Error al cargar encargados para usuario:', err);
              this.alertService.error('Error al cargar los datos de los encargados');
              this.isLoading = false;
            }
          });
        },
        error: (err) => {
          console.error('Error al cargar tareas para usuario normal:', err);
          this.alertService.error('Error al cargar las tareas asignadas');
          this.isLoading = false;
        }
      });
    }
  }


  puedeEditarTarea(tarea: Tarea): boolean {
    return this.authService.canEditTask(tarea);
  }
  puedeEliminarTarea(tarea: Tarea): boolean {
    return this.authService.canDeleteTask(tarea);
  }

  editarTarea(tareaId: number): void {
    console.log('Intentando editar tarea ID:', tareaId);

    const tarea = this.tareas.find(t => t.id === tareaId) ||
      this.tareasAsignadas.find(t => t.id === tareaId) ||
      this.tareasProyectosAsignados.find(t => t.id === tareaId);

    if (!tarea) {
      console.error('Tarea no encontrada en ninguna lista');
      this.alertService.error('Tarea no encontrada');
      return;
    }

    console.log('Datos de la tarea:', tarea);
    console.log('Encargado del proyecto:', tarea.encargadoProyecto);
    console.log('Usuario actual:', this.authService.currentUserValue);

    if (!this.authService.canEditTask(tarea)) {
      console.error('Permiso denegado para editar esta tarea');
      this.alertService.error('No tienes permiso para editar esta tarea');
      return;
    }

    this.router.navigate(['/dashboard/tareas', tareaId], {
      state: { shouldReload: true }
    });
  }


  verTarea(tareaId: number): void {
    console.log('Navegando a detalle de tarea ID:', tareaId);
    this.router.navigate(['/dashboard/tareas/detalle', tareaId], {
      state: { shouldReload: true }
    });
  }

  contarTareasPorEstado(estado: EstadoTarea): number {
    if (this.authService.isEncargado()) {
      return [...this.tareasAsignadas, ...this.tareasProyectosAsignados].filter(t => t.estado === estado).length;
    }
    return this.tareas.filter(t => t.estado === estado).length;
  }

  private eliminarDuplicados(array: any[], key: string): any[] {
    return array.filter((obj, index, self) =>
      index === self.findIndex((t) => t[key] === obj[key])
    );
  }

  puedeCambiarEstado(tarea: Tarea): boolean {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;

    if (this.authService.isAdmin()) {
      return true;
    }

    if (tarea.usuarioAsignadoUsername === currentUser.username) {
      return true;
    }

    if (this.authService.isEncargado() &&
      tarea.encargadoProyecto?.username === currentUser.username) {
      return false;
    }

    return false;
  }

  private cargarEncargadosDeProyectos(tareas: Tarea[]): Observable<Tarea[]> {
    console.log('Cargando encargados para tareas:', tareas);
    const proyectoIds = [...new Set(tareas.map(t => t.proyectoId))];
    console.log('IDs de proyectos únicos:', proyectoIds);

    if (proyectoIds.length === 0) {
      return of(tareas);
    }


    const observables = proyectoIds.map(proyectoId =>
      this.proyectoService.obtenerEncargado(proyectoId).pipe(
        catchError(err => {
          console.warn(`Error al obtener encargado para proyecto ${proyectoId}:`, err);
          return of(null);
        }),
        map(encargado => ({ proyectoId, encargado }))
      )
    );

    return forkJoin(observables).pipe(
      map(resultados => {
        const encargadosMap = new Map<number, any>();
        resultados.forEach(({ proyectoId, encargado }) => {
          if (encargado) {
            encargadosMap.set(proyectoId, encargado);
          }
        });
        console.log('Mapa de encargados:', encargadosMap);

        return tareas.map(tarea => ({
          ...tarea,
          encargadoProyecto: encargadosMap.get(tarea.proyectoId) || null
        }));
      })
    );
  }

  filtrarTareasPorEstado(estado: EstadoTarea | 'todas'): void {
    this.filtroEstado = estado;
    this.currentPage = 1;
  }

  get tareasFiltradas(): Tarea[] {
    let filtered = this.filtroEstado === 'todas'
      ? this.tareas
      : this.tareas.filter(t => t.estado === this.filtroEstado);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get tareasAsignadasFiltradas(): Tarea[] {
    let filtered = this.filtroEstado === 'todas'
      ? this.tareasAsignadas
      : this.tareasAsignadas.filter(t => t.estado === this.filtroEstado);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get tareasProyectosAsignadosFiltradas(): Tarea[] {
    let filtered = this.filtroEstado === 'todas'
      ? this.tareasProyectosAsignados
      : this.tareasProyectosAsignados.filter(t => t.estado === this.filtroEstado);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalFilteredItems(): number {
    if (this.authService.isEncargado()) {
      return this.filtroEstado === 'todas'
        ? this.tareasAsignadas.length + this.tareasProyectosAsignados.length
        : [...this.tareasAsignadas, ...this.tareasProyectosAsignados].filter(t => t.estado === this.filtroEstado).length;
    }

    return this.filtroEstado === 'todas'
      ? this.tareas.length
      : this.tareas.filter(t => t.estado === this.filtroEstado).length;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  cambiarEstadoTarea(tareaId: number, nuevoEstado: EstadoTarea): void {
    this.tareaService.actualizarEstadoTarea(tareaId, nuevoEstado).subscribe({
      next: () => {

        this.actualizarEstadoEnListas(tareaId, nuevoEstado);

        const tarea = this.tareas.find(t => t.id === tareaId) ||
          this.tareasAsignadas.find(t => t.id === tareaId) ||
          this.tareasProyectosAsignados.find(t => t.id === tareaId);

        if (tarea) {
          tarea.estado = nuevoEstado;
          if (nuevoEstado === 'Completada') {
            this.alertService.success(`Tarea "${tarea.titulo}" completada con éxito`);
          }
        }
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        this.alertService.error('Error al actualizar el estado de la tarea');
      }
    });
  }

  private actualizarEstadoEnListas(tareaId: number, nuevoEstado: EstadoTarea): void {

    this.tareas = this.tareas.map(t =>
      t.id === tareaId ? { ...t, estado: nuevoEstado } : t
    );

    this.tareasAsignadas = this.tareasAsignadas.map(t =>
      t.id === tareaId ? { ...t, estado: nuevoEstado } : t
    );

    this.tareasProyectosAsignados = this.tareasProyectosAsignados.map(t =>
      t.id === tareaId ? { ...t, estado: nuevoEstado } : t
    );
  }

  isFechaVencida(fechaLimite: Date | string): boolean {
    const fecha = typeof fechaLimite === 'string' ? new Date(fechaLimite) : fechaLimite;
    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);

    return fecha < hoy;
  }

  getDisplayRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalFilteredItems);
    return `${start} - ${end} de ${this.totalFilteredItems}`;
  }

  async eliminarTarea(tareaId: number): Promise<void> {
    const tarea = this.tareas.find(t => t.id === tareaId) ||
      this.tareasAsignadas.find(t => t.id === tareaId) ||
      this.tareasProyectosAsignados.find(t => t.id === tareaId);

    const tareaNombre = tarea?.titulo || 'esta tarea';

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      html: `Estás a punto de eliminar la tarea: <strong>"${tareaNombre}"</strong>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      backdrop: true,
      allowOutsideClick: false,
      allowEscapeKey: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.isDeleting = tareaId;
        return this.tareaService.eliminarTarea(tareaId).toPromise()
          .catch(error => {
            Swal.showValidationMessage(
              `Error al eliminar: ${error.message || 'Error desconocido'}`
            );
          });
      }
    });

    if (result.isConfirmed) {
      this.tareas = this.tareas.filter(t => t.id !== tareaId);
      this.tareasAsignadas = this.tareasAsignadas.filter(t => t.id !== tareaId);
      this.tareasProyectosAsignados = this.tareasProyectosAsignados.filter(t => t.id !== tareaId);

      Swal.fire({
        title: '¡Eliminada!',
        text: `La tarea "${tareaNombre}" ha sido eliminada.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: 'Cancelado',
        text: 'La tarea no ha sido eliminada',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false
      });
    }

    this.isDeleting = null;
  }


}

