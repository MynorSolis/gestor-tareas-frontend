import { Component, OnInit } from '@angular/core';
import { TareaService } from '../../../shared/services/tarea.service';
import { ProyectoService } from '../../../shared/services/proyecto.service';
import { Chart, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: false,
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css']
})
export class DashboardHomeComponent implements OnInit {
  tareasRecientes: any[] = [];
  tareasAsignadas: any[] = [];
  proyectosRecientes: any[] = [];
  proyectosAsignados: any[] = [];
  estadisticas: any = {
    tareasTotales: 0,
    tareasCompletadas: 0,
    tareasEnProgreso: 0,
    tareasPendientes: 0,
    proyectosActivos: 0
  };
  chart: any;
  isLoading = true;
  currentUserRole: string = '';

  constructor(
    private tareaService: TareaService,
    private proyectoService: ProyectoService,
    private authService: AuthService
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.currentUserRole = this.getUserMainRole();
    this.cargarDatos();
  }

  getUserMainRole(): string {
    const roles = this.authService.getUserRoles();
    if (roles.includes('ROLE_ADMIN')) return 'ROLE_ADMIN';
    if (roles.includes('ROLE_ENCARGADO')) return 'ROLE_ENCARGADO';
    return 'ROLE_USER';
  }

  cargarDatos(): void {
    this.isLoading = true;
    
    switch(this.currentUserRole) {
      case 'ROLE_ADMIN':
        this.loadAdminData();
        break;
      case 'ROLE_ENCARGADO':
        this.loadEncargadoData();
        break;
      case 'ROLE_USER':
        this.loadUserData();
        break;
      default:
        this.loadUserData();
    }
  }

  loadAdminData(): void {
    forkJoin({
      tareas: this.tareaService.obtenerTodasTareas(),
      proyectos: this.proyectoService.obtenerTodosProyectos()
    }).subscribe({
      next: ({tareas, proyectos}) => {
        this.procesarTareas(tareas);
        this.procesarProyectos(proyectos);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        this.isLoading = false;
      }
    });
  }

  loadEncargadoData(): void {
    forkJoin({
      tareas: this.tareaService.obtenerTareasPorEncargado(),
      proyectos: this.proyectoService.obtenerProyectosPorEncargado()
    }).subscribe({
      next: ({tareas, proyectos}) => {
        this.procesarTareas(tareas);
        this.procesarProyectos(proyectos);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        this.isLoading = false;
      }
    });
  }

  loadUserData(): void {
    this.tareaService.obtenerTareasPorUsuarioAsignado().subscribe({
      next: (tareas) => {
        this.procesarTareas(tareas);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar tareas:', err);
        this.isLoading = false;
      }
    });
  }

  procesarTareas(tareas: any[]): void {
    
    const tareasOrdenadas = [...tareas].sort((a, b) => 
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );

    this.tareasRecientes = tareasOrdenadas.slice(0, 5);
    this.tareasAsignadas = tareasOrdenadas;
    
   
    this.estadisticas = {
      tareasTotales: tareas.length,
      tareasCompletadas: tareas.filter(t => t.estado === 'Completada').length,
      tareasEnProgreso: tareas.filter(t => t.estado === 'En progreso').length,
      tareasPendientes: tareas.filter(t => t.estado === 'Pendiente').length,
      proyectosActivos: this.proyectosRecientes.length
    };

    this.renderChart();
  }

  procesarProyectos(proyectos: any[]): void {
    
    this.proyectosRecientes = [...proyectos]
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      .slice(0, 4);
    this.proyectosAsignados = proyectos;
  }

renderChart(): void {
  const ctx = document.getElementById('tareasChart') as HTMLCanvasElement;
  
  if (this.chart) {
    this.chart.destroy();
  }

  this.chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Completadas', 'En progreso', 'Pendientes'],
      datasets: [{
        data: [
          this.estadisticas.tareasCompletadas,
          this.estadisticas.tareasEnProgreso,
          this.estadisticas.tareasPendientes
        ],
        backgroundColor: [
          '#10B981',
          '#3B82F6', 
          '#F59E0B'  
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 10,
        hoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            font: {
              size: 13,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              weight: 500
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleFont: {
            size: 14,
            weight: 600
          },
          bodyFont: {
            size: 13,
            weight: 400
          },
          padding: 12,
          usePointStyle: true,
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = Number(context.raw) || 0;
              const total = (context.dataset.data as number[]).reduce((a, b) => Number(a) + Number(b), 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return ` ${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        animateScale: true,
        animateRotate: true
      }
    }
  });
}
}