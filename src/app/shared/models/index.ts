export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre?: string;
  apellido?: string;
  roles: string[];
  fechaCreacion?: Date;
}

export interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string;
  fechaCreacion: Date;
  fechaLimite: Date;
  creadorId: number;
  creadorUsername: string;
  encargadoId?: number;
  encargadoUsername?: string;
}

export interface ProyectoConEncargados extends Proyecto {
  encargados: Usuario[];
}

export type EstadoTarea = 'Pendiente' | 'En progreso' | 'Completada';

export interface ProyectoConTareas extends Proyecto {
  tareas: Tarea[];
  cantidadTareas: number;
}

export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  fechaCreacion: Date;
  fechaLimite: Date;
  estado: EstadoTarea;
  prioridad: 'Baja' | 'Media' | 'Alta';
  proyectoId: number;
  proyectoNombre: string;
  usuarioAsignadoId?: number;
  usuarioAsignadoUsername?: string;
  creadorId: number;
  creadorUsername: string;
  encargadoProyecto?: Usuario | null;
}

export interface Comentario {
  id: number;
  texto: string;
  autor: string;
  autorUsername: string;
  fechaCreacion: string; 
  tareaId: number;
}

export interface ArchivoTarea {
  id: number;
  nombre: string;
  url: string;
  subidoPor: string;
  subidoPorUsername: string;
  fechaSubida: string; 
  tareaId: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegistroRequest {
  username: string;
  email: string;
  password: string;
  roles?: string[];
}

export interface CambioPasswordRequest {
  currentPassword: string;
  newPassword: string;
}