import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../../../shared/services/usuario.service';
import { Usuario } from '../../../../shared/models';
import { AuthService } from '../../../../shared/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuarios-list',
  standalone: false,
  templateUrl: './usuarios-list.component.html',
  styleUrls: ['./usuarios-list.component.css']
})
export class UsuariosListComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuariosPaginados: Usuario[] = [];
  isLoading = true;

  currentPage = 1;
  itemsPerPage = 10;

  constructor(
    private usuarioService: UsuarioService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.isLoading = true;
    this.usuarioService.obtenerTodosUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.actualizarUsuariosPaginados();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;

      }
    });
  }

  actualizarUsuariosPaginados(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.usuariosPaginados = this.usuarios.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.actualizarUsuariosPaginados();
  }

  getDisplayRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.usuarios.length);
    return `${start} - ${end} de ${this.usuarios.length}`;
  }

  cambiarRolUsuario(usuarioId: number, rol: string): void {
    const rolShort = rol.replace('ROLE_', '');
    this.usuarioService.cambiarRolUsuario(usuarioId, rolShort).subscribe({
      next: () => {
        const usuario = this.usuarios.find(u => u.id === usuarioId);
        if (usuario) {
          usuario.roles = [rol];
        }
      },
      error: (error) => {
        console.error('Error cambiando rol:', error);
      }
    });
  }

  async eliminarUsuario(id: number, nombre: string): Promise<void> {
    try {
      let conteoAsignaciones = { tareas: 0, proyectos: 0 };

      try {

        conteoAsignaciones = await this.usuarioService.obtenerConteoAsignaciones(id).toPromise() || { tareas: 0, proyectos: 0 };
      } catch (error) {
        console.error('Error al obtener conteo de asignaciones:', error);
        conteoAsignaciones = { tareas: 1, proyectos: 0 };
      }


      if (conteoAsignaciones.tareas > 0 || conteoAsignaciones.proyectos > 0) {
        let mensaje = `El usuario "${nombre}" no puede ser eliminado porque:`;
        let detalles: string[] = [];

        if (conteoAsignaciones.tareas > 0) {
          detalles.push(` Tiene ${conteoAsignaciones.tareas} tarea${conteoAsignaciones.tareas > 1 ? 's' : ''} asignada${conteoAsignaciones.tareas > 1 ? 's' : ''}`);
        }

        if (conteoAsignaciones.proyectos > 0) {
          detalles.push(` Es creador de ${conteoAsignaciones.proyectos} proyecto${conteoAsignaciones.proyectos > 1 ? 's' : ''}`);
        }

        mensaje += '\n\n' + detalles.join('\n');
        mensaje += '\n\nPrimero debes reasignar o eliminar estas dependencias.';

        Swal.fire({
          icon: 'error',
          title: 'No se puede eliminar el usuario',
          text: mensaje,
          confirmButtonText: 'Entendido',
          width: '500px'
        });
        return;
      }

      const result = await Swal.fire({
        title: `¿Estás seguro de eliminar al usuario "${nombre}"?`,
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'No, cancelar'
      });

      if (!result.isConfirmed) return;

      await this.usuarioService.eliminarUsuario(id).toPromise();
      this.usuarios = this.usuarios.filter(u => u.id !== id);
      this.actualizarUsuariosPaginados();

      await Swal.fire(
        '¡Eliminado!',
        'El usuario ha sido eliminado correctamente.',
        'success'
      );
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);

      let errorMessage = 'Ocurrió un error al eliminar el usuario';
      const errorText = error.message || error.toString();

      if (errorText.includes('asignado a tareas')) {
        errorMessage = 'No se puede eliminar el usuario porque está asignado a tareas';
      } else if (errorText.includes('creador de proyectos')) {
        errorMessage = 'No se puede eliminar el usuario porque es creador de proyectos';
      }

      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonText: 'Entendido'
      });
    }
  }
}