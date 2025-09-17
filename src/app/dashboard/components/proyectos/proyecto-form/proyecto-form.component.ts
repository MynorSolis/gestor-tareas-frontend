import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProyectoService } from '../../../../shared/services/proyecto.service';
import { ToastrService } from 'ngx-toastr';
import { Proyecto, Usuario } from '../../../../shared/models';
import { UsuarioService } from '../../../../shared/services/usuario.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { AlertService } from '../../../../shared/services/alert.service';

@Component({
  selector: 'app-proyecto-form',
  standalone: false,
  templateUrl: './proyecto-form.component.html',
  styleUrls: ['./proyecto-form.component.css']
})
export class ProyectoFormComponent implements OnInit {
  proyectoForm: FormGroup;
  isEditMode = false;
  proyectoId: number | null = null;
  isLoading = false;
  encargados: Usuario[] = [];
  isEncargado = false;

  constructor(
    private fb: FormBuilder,
    private proyectoService: ProyectoService,
    private usuarioService: UsuarioService,
    public authService: AuthService,
    private route: ActivatedRoute,
    public router: Router,
    private toastr: ToastrService,
    private alertService: AlertService
  ) {
    this.proyectoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      fechaLimite: ['', Validators.required],
      encargadoId: [null]
    });
    this.isEncargado = this.authService.isEncargado();
  }

  ngOnInit(): void {
    if (!this.isEncargado) {
     
      this.usuarioService.obtenerUsuariosPorRol('ROLE_ENCARGADO').subscribe({
        next: (usuarios) => {
          this.encargados = usuarios;
        },
        error: (error) => {
          console.error('Error al cargar los encargados:', error);
          this.toastr.error('Error al cargar los encargados');
        }
      });
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.proyectoId = +id;
      this.cargarProyecto(this.proyectoId);
    } else if (this.isEncargado) {
      
      this.proyectoForm.patchValue({
        encargadoId: this.authService.currentUserValue?.id
      });
    }
  }

  cargarProyecto(id: number): void {
    this.proyectoService.obtenerProyectoPorId(id).subscribe({
      next: (proyecto) => {
        this.proyectoForm.patchValue({
          nombre: proyecto.nombre,
          descripcion: proyecto.descripcion,
          fechaLimite: new Date(proyecto.fechaLimite).toISOString().split('T')[0],
          encargadoId: proyecto.encargadoId || null
        });
        
       
        if (this.isEncargado) {
          this.proyectoForm.patchValue({
            encargadoId: this.authService.currentUserValue?.id
          });
        }
      },
      error: (error) => {
        console.error('Error al cargar el proyecto:', error);
        this.toastr.error('Error al cargar el proyecto');
      }
    });
  }

onSubmit(): void {
  if (this.proyectoForm.invalid) {
    this.proyectoForm.markAllAsTouched();
    return;
  }

  this.isLoading = true;
  const proyectoData = this.proyectoForm.value;

  if (this.isEditMode && this.proyectoId) {
    this.proyectoService.actualizarProyecto(this.proyectoId, proyectoData).subscribe({
      next: () => {        
        this.router.navigate(['/dashboard/proyectos']).then(() => {
          this.alertService.success('Proyecto actualizado correctamente');
        });
      },
      error: (error) => {
        console.error('Error al actualizar:', error);
        this.alertService.error('Error al actualizar el proyecto');
        this.isLoading = false;
      }
    });
  } else {
    this.proyectoService.crearProyecto(proyectoData).subscribe({
      next: () => {
        this.router.navigate(['/dashboard/proyectos']).then(() => {
          this.alertService.success('Proyecto creado correctamente');
        });
      },
      error: (error) => {
        console.error('Error al crear:', error);
        this.alertService.error('Error al crear el proyecto');
        this.isLoading = false;
      }
    });
  }
}

  navigateToProjects(): void {
    this.router.navigate(['/dashboard/proyectos']);
  }
}