import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TareaService } from '../../../../shared/services/tarea.service';
import { ProyectoService } from '../../../../shared/services/proyecto.service';
import { UsuarioService } from '../../../../shared/services/usuario.service';
import { ToastrService } from 'ngx-toastr';
import { Tarea, Usuario } from '../../../../shared/models';
import { AuthService } from '../../../../shared/services/auth.service';
import { AlertService } from '../../../../shared/services/alert.service';
import { catchError, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-tarea-form',
  standalone: false,
  templateUrl: './tarea-form.component.html',
  styleUrls: ['./tarea-form.component.css']
})
export class TareaFormComponent implements OnInit {
  tareaForm: FormGroup;
  isEditMode = false;
  tareaId: number | null = null;
  proyectos: any[] = [];
  usuarios: any[] = [];
  isLoading = false;
  isEncargado = false;
  currentUser: Usuario | null = null;
  tareaOriginal: Tarea | null = null;

  constructor(
    private fb: FormBuilder,
    private tareaService: TareaService,
    private proyectoService: ProyectoService,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private route: ActivatedRoute,
    public router: Router,
    private toastr: ToastrService,
    private alertService: AlertService
  ) {
    this.tareaForm = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: [''],
      fechaLimite: ['', Validators.required],
      prioridad: ['Media', Validators.required],
      proyectoId: ['', Validators.required],
      usuarioAsignadoId: [{ value: '', disabled: false }]
    });
    this.isEncargado = this.authService.isEncargado();
    this.currentUser = this.authService.currentUserValue;
  }

  ngOnInit(): void {
    this.cargarProyectos();
    this.cargarUsuarios();
    this.route.queryParams.subscribe(params => {
      if (params['proyectoId'] && !this.isEditMode) {
        const proyectoId = +params['proyectoId'];

        setTimeout(() => {
          if (this.proyectos.some(p => p.id === proyectoId)) {
            this.tareaForm.patchValue({ proyectoId: proyectoId });
          }
        }, 300);
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.tareaId = +id;
      this.cargarTarea(this.tareaId);
    }
  }

  cargarProyectos(): void {
    if (this.isEncargado) {
      this.proyectoService.obtenerProyectosPorEncargado().subscribe(proyectos => {
        this.proyectos = proyectos;

        const proyectoIdParam = this.route.snapshot.queryParams['proyectoId'];
        if (proyectoIdParam && !this.isEditMode) {
          const proyectoId = +proyectoIdParam;
          if (this.proyectos.some(p => p.id === proyectoId)) {
            this.tareaForm.patchValue({ proyectoId: proyectoId });
          }
        }

        if (this.isEditMode && this.tareaId) {
          this.verificarProyectoTarea();
        }
      });
    } else {
      this.proyectoService.obtenerTodosProyectos().subscribe(proyectos => {
        this.proyectos = proyectos;


        const proyectoIdParam = this.route.snapshot.queryParams['proyectoId'];
        if (proyectoIdParam && !this.isEditMode) {
          const proyectoId = +proyectoIdParam;
          if (this.proyectos.some(p => p.id === proyectoId)) {
            this.tareaForm.patchValue({ proyectoId: proyectoId });
          }
        }
      });
    }
  }
  verificarProyectoTarea(): void {
    if (!this.tareaOriginal) return;

    const proyectoId = this.tareaOriginal.proyectoId;
    if (!this.proyectos.some(p => p.id === proyectoId)) {
      this.proyectoService.obtenerProyectoPorId(proyectoId).subscribe(proyecto => {
        this.proyectos = [proyecto, ...this.proyectos];
        this.tareaForm.patchValue({ proyectoId: proyectoId });
      });
    }
  }

  cargarTarea(id: number): void {
    this.isLoading = true;

    this.tareaService.obtenerTareaPorId(id).pipe(
      switchMap(tarea => {
        this.tareaOriginal = tarea;

        return this.proyectoService.obtenerEncargado(tarea.proyectoId).pipe(
          catchError(() => of(null)),
          map(encargado => ({ ...tarea, encargadoProyecto: encargado }))
        );
      })
    ).subscribe({
      next: (tareaConEncargado) => {

        if (!this.authService.canEditTask(tareaConEncargado)) {
          this.alertService.error('No tienes permiso para editar esta tarea');
          this.router.navigate(['/dashboard/tareas']);
          return;
        }


        const usuarioAsignadoControl = this.tareaForm.get('usuarioAsignadoId');

        if (this.authService.isEncargado() && !this.authService.isAdmin() &&
          tareaConEncargado.encargadoProyecto?.username !== this.currentUser?.username) {
          usuarioAsignadoControl?.disable();
        } else {
          usuarioAsignadoControl?.enable();
        }

        this.tareaForm.patchValue({
          titulo: tareaConEncargado.titulo,
          descripcion: tareaConEncargado.descripcion,
          fechaLimite: new Date(tareaConEncargado.fechaLimite).toISOString().split('T')[0],
          prioridad: tareaConEncargado.prioridad,
          proyectoId: tareaConEncargado.proyectoId,
          usuarioAsignadoId: tareaConEncargado.usuarioAsignadoId || ''
        });

        if (!this.proyectos.some(p => p.id === tareaConEncargado.proyectoId)) {
          this.proyectoService.obtenerProyectoPorId(tareaConEncargado.proyectoId).subscribe(proyecto => {
            this.proyectos = [proyecto, ...this.proyectos];
          });
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.alertService.error(err.message || 'Error al cargar la tarea');
        this.router.navigate(['/dashboard/tareas']);
      }
    });
  }


  cargarUsuarios(): void {
    this.usuarioService.obtenerTodosUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.toastr.error('Error al cargar la lista de usuarios');
        this.usuarios = [];
      }
    });
  }

  onSubmit(): void {
    if (this.tareaForm.invalid) {
      return;
    }

    this.isLoading = true;
    const tareaData = {
      ...this.tareaForm.value,
      estado: 'Pendiente',
      creadorId: this.currentUser?.id
    };

    if (this.tareaForm.get('usuarioAsignadoId')?.disabled) {
      tareaData.usuarioAsignadoId = this.tareaOriginal?.usuarioAsignadoId || this.currentUser?.id;
    }

    const operation = this.isEditMode && this.tareaId
      ? this.tareaService.actualizarTarea(this.tareaId, tareaData)
      : this.tareaService.crearTarea(tareaData);

    operation.subscribe({
      next: (tareaCreada) => {
        this.router.navigate(['/dashboard/tareas']).then(() => {
          if (this.isEditMode) {
            this.alertService.success('Tarea actualizada correctamente');
          } else {
            this.alertService.success('Tarea creada correctamente');
          }
        });
      },
      error: (err) => {
        const errorMessage = err.error?.message || `Error al ${this.isEditMode ? 'actualizar' : 'crear'} la tarea`;
        this.alertService.error(errorMessage);
        this.isLoading = false;
      }
    });
  }
}