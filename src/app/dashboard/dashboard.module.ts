import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardHomeComponent } from './components/dashboard-home/dashboard-home.component';
import { ProyectosListComponent } from './components/proyectos/proyectos-list/proyectos-list.component';
import { ProyectoFormComponent } from './components/proyectos/proyecto-form/proyecto-form.component';
import { TareasListComponent } from './components/tareas/tareas-list/tareas-list.component';
import { TareaFormComponent } from './components/tareas/tarea-form/tarea-form.component';
import { UsuariosListComponent } from './components/usuarios/usuarios-list/usuarios-list.component';
import { FeatherModule } from 'angular-feather';
import { Check, CheckCircle } from 'angular-feather/icons';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DetalleTareaComponent } from './components/tareas/detalle-tarea/detalle-tarea.component';




@NgModule({
  declarations: [
    DashboardHomeComponent,
    ProyectosListComponent,
    ProyectoFormComponent,
    TareasListComponent,
    TareaFormComponent,
    UsuariosListComponent,
    PerfilComponent,
    DetalleTareaComponent,
    
    


    
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
     FeatherModule,
     ReactiveFormsModule,
     CommonModule, 
     FormsModule,
     SharedModule,
     DragDropModule
    
  ]
})
export class DashboardModule { }
