import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TareaService } from '../../../../shared/services/tarea.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { AlertService } from '../../../../shared/services/alert.service';
import { Tarea, Comentario, ArchivoTarea } from '../../../../shared/models';


@Component({
  selector: 'app-detalle-tarea',
  standalone: false,
  templateUrl: './detalle-tarea.component.html',
  styleUrl: './detalle-tarea.component.css'
})
export class DetalleTareaComponent implements OnInit {
  @Input() tareaId?: number;
  @Input() mostrarModal: boolean = false;
  @Output() cerrar = new EventEmitter<void>();

  tarea: Tarea | null = null;
  comentarios: Comentario[] = [];
  archivos: ArchivoTarea[] = [];

  isLoading = true;
  subiendoArchivo = false;


  nuevoComentario = '';
  archivosSeleccionados: File[] = [];


  @ViewChild('comentariosContainer') private comentariosContainer!: ElementRef;
  private shouldScrollToBottom = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tareaService: TareaService,
    public authService: AuthService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {

    const id = this.tareaId || +this.route.snapshot.params['id'];
    if (id) {
      this.cargarDetalleTarea(id);
    }
  }

  cargarDetalleTarea(id: number): void {
    this.isLoading = true;


    this.tareaService.obtenerTareaPorId(id).subscribe({
      next: (tarea) => {
        this.tarea = tarea;
        this.cargarComentarios(id);
        this.cargarArchivos(id);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar tarea:', err);
        this.alertService.error('Error al cargar los detalles de la tarea');
        this.isLoading = false;
      }
    });
  }

  cargarComentarios(tareaId: number): void {
    this.tareaService.obtenerComentariosPorTarea(tareaId).subscribe({
      next: (comentarios) => {
        this.comentarios = comentarios;
        if (comentarios.length > 0) {
          this.shouldScrollToBottom = true;
        }
      },
      error: (err) => {
        console.error('Error al cargar comentarios:', err);
        this.alertService.error('Error al cargar los comentarios');
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  cargarArchivos(tareaId: number): void {
    this.tareaService.obtenerArchivosPorTarea(tareaId).subscribe({
      next: (archivos) => {
        this.archivos = archivos;
      },
      error: (err) => {
        console.error('Error al cargar archivos:', err);
        this.alertService.error('Error al cargar los archivos');
      }
    });
  }

  puedeCambiarEstado(): boolean {
    if (!this.tarea) return false;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;

    if (this.authService.isAdmin()) {
      return true;
    }

    if (this.authService.isEncargado()) {
      return this.tarea.usuarioAsignadoUsername === currentUser.username;
    }

    if (this.authService.isUser() && this.tarea.usuarioAsignadoUsername === currentUser.username) {
      return true;
    }

    return false;
  }

  puedeSubirArchivos(): boolean {
    if (!this.tarea) return false;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;

    if (this.authService.isAdmin()) {
      return true;
    }

    if (this.authService.isEncargado()) {
      return this.tarea.usuarioAsignadoUsername === currentUser.username;
    }

    if (this.authService.isUser() && this.tarea.usuarioAsignadoUsername === currentUser.username) {
      return true;
    }

    return false;
  }

  esEncargadoDelProyecto(): boolean {
    if (!this.tarea || !this.tarea.encargadoProyecto) return false;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;

    return this.tarea.encargadoProyecto.username === currentUser.username;
  }

  puedeAgregarComentarios(): boolean {
    return this.authService.currentUserValue !== null;
  }

  puedeVerArchivos(): boolean {
    return this.authService.currentUserValue !== null;
  }

  puedeDescargarArchivos(): boolean {
    return this.authService.currentUserValue !== null;
  }

  cambiarEstado(): void {
    if (!this.tarea || !this.puedeCambiarEstado()) return;

    this.tareaService.actualizarEstadoTarea(this.tarea.id, this.tarea.estado).subscribe({
      next: () => {
        this.alertService.success('Estado actualizado correctamente');
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        this.alertService.error('Error al actualizar el estado');

        this.cargarDetalleTarea(this.tarea!.id);
      }
    });
  }

  agregarComentario(): void {
    if (!this.nuevoComentario.trim() || !this.tarea || !this.puedeAgregarComentarios()) return;

    const comentarioRequest = {
      texto: this.nuevoComentario.trim(),
      tareaId: this.tarea.id
    };

    this.tareaService.agregarComentario(comentarioRequest).subscribe({
      next: (comentario) => {
        this.comentarios.push(comentario);
        this.nuevoComentario = '';
        this.alertService.success('Comentario agregado correctamente');

        this.shouldScrollToBottom = true;
      },
      error: (err) => {
        console.error('Error al agregar comentario:', err);
        this.alertService.error('Error al agregar el comentario');
      }
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.comentariosContainer) {
        const element = this.comentariosContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.log('Error al hacer scroll:', err);
    }
  }

  onFileSelected(event: any): void {
    if (!this.puedeSubirArchivos()) return;

    const files = event.target.files;
    if (files) {
      this.archivosSeleccionados = Array.from(files);
    }
  }

  removerArchivo(archivo: File): void {
    if (!this.puedeSubirArchivos()) return;

    this.archivosSeleccionados = this.archivosSeleccionados.filter(f => f !== archivo);
  }

  subirArchivos(): void {
    if (this.archivosSeleccionados.length === 0 || !this.tarea || !this.puedeSubirArchivos()) return;

    this.subiendoArchivo = true;


    const subirArchivo = (index: number) => {
      if (index >= this.archivosSeleccionados.length) {
        this.subiendoArchivo = false;
        this.archivosSeleccionados = [];
        this.cargarArchivos(this.tarea!.id);
        this.alertService.success('Archivos subidos correctamente');
        return;
      }

      const archivo = this.archivosSeleccionados[index];
      this.tareaService.subirArchivo(this.tarea!.id, archivo).subscribe({
        next: () => {
          subirArchivo(index + 1);
        },
        error: (err) => {
          console.error('Error al subir archivo:', err);
          this.alertService.error(`Error al subir el archivo: ${archivo.name}`);
          this.subiendoArchivo = false;
        }
      });
    };

    subirArchivo(0);
  }

  puedeEliminarArchivo(archivo: ArchivoTarea): boolean {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;

    return this.authService.isAdmin() || archivo.subidoPorUsername === currentUser.username;
  }

  eliminarArchivo(archivo: ArchivoTarea): void {
    if (!this.puedeEliminarArchivo(archivo)) return;

    if (confirm(`¿Estás seguro de que quieres eliminar el archivo "${archivo.nombre}"?`)) {
      this.tareaService.eliminarArchivo(archivo.id).subscribe({
        next: () => {
          this.archivos = this.archivos.filter(a => a.id !== archivo.id);
          this.alertService.success('Archivo eliminado correctamente');
        },
        error: (err) => {
          console.error('Error al eliminar archivo:', err);
          this.alertService.error('Error al eliminar el archivo');
        }
      });
    }
  }

  descargarArchivo(archivo: ArchivoTarea): void {
    if (!this.puedeDescargarArchivos()) return;

    this.tareaService.descargarArchivo(archivo.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = archivo.nombre;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al descargar archivo:', err);
        this.alertService.error('Error al descargar el archivo');
      }
    });
  }

  isFechaVencida(fechaLimite: Date | string): boolean {
    const fecha = typeof fechaLimite === 'string' ? new Date(fechaLimite) : fechaLimite;
    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);

    return fecha < hoy;
  }

  cerrarDetalle(): void {
    if (this.mostrarModal) {
      this.cerrar.emit();
    } else {
      this.router.navigate(['/dashboard/tareas']);
    }
  }

  obtenerIconoArchivo(nombreArchivo: string): string {
    const extension = nombreArchivo.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'file-text';
      case 'doc':
      case 'docx':
        return 'file-text';
      case 'xls':
      case 'xlsx':
        return 'file-text';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'zip':
      case 'rar':
        return 'archive';
      default:
        return 'file';
    }
  }


  puedeEliminarComentario(comentario: Comentario): boolean {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;


    return this.authService.isAdmin() || comentario.autorUsername === currentUser.username;
  }


  eliminarComentario(comentario: Comentario): void {
    if (!this.puedeEliminarComentario(comentario)) return;


    this.alertService.confirm(
      '¿Estás seguro?',
      `¿Quieres eliminar este comentario? Esta acción no se puede deshacer.`,
      'Eliminar',
      'Cancelar'
    ).then((result) => {
      if (result.isConfirmed) {
        this.tareaService.eliminarComentario(comentario.id).subscribe({
          next: () => {

            this.comentarios = this.comentarios.filter(c => c.id !== comentario.id);
            this.alertService.success('Comentario eliminado correctamente');
          },
          error: (err) => {
            console.error('Error al eliminar comentario:', err);
            this.alertService.error('Error al eliminar el comentario');
          }
        });
      }
    });
  }
}