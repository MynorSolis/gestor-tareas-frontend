import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardHomeComponent } from './components/dashboard-home/dashboard-home.component';
import { ProyectosListComponent } from './components/proyectos/proyectos-list/proyectos-list.component';
import { ProyectoFormComponent } from './components/proyectos/proyecto-form/proyecto-form.component';
import { TareasListComponent } from './components/tareas/tareas-list/tareas-list.component';
import { TareaFormComponent } from './components/tareas/tarea-form/tarea-form.component';
import { UsuariosListComponent } from './components/usuarios/usuarios-list/usuarios-list.component';
import { RoleGuard } from '../shared/guards/role.guard';

import { AuthGuard } from '../shared/guards/auth.guard';
import { PerfilComponent } from './components/perfil/perfil.component';
import { DetalleTareaComponent } from './components/tareas/detalle-tarea/detalle-tarea.component';


const routes: Routes = [
  { 
    path: '', 
    component: DashboardHomeComponent 
  },
  { 
    path: 'tareas', 
    component: TareasListComponent 
  },
    { 
    path: 'tareas/detalle/:id',  
    component: DetalleTareaComponent 
  },
  { 
    path: 'tareas/nueva', 
    component: TareaFormComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ENCARGADO', 'ROLE_ADMIN'] }
  },
  { 
    path: 'tareas/:id', 
    component: TareaFormComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ENCARGADO', 'ROLE_ADMIN'] }
  },
  { 
    path: 'proyectos', 
    component: ProyectosListComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ENCARGADO', 'ROLE_ADMIN'] }
  },
  { 
    path: 'proyectos/nuevo', 
    component: ProyectoFormComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ENCARGADO', 'ROLE_ADMIN'] }
  },
  { 
    path: 'proyectos/:id', 
    component: ProyectoFormComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ENCARGADO', 'ROLE_ADMIN'] }
  },
  { 
    path: 'usuarios', 
    component: UsuariosListComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },
  { path: 'perfil', component: PerfilComponent }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }