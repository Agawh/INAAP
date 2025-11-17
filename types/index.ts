// /types/index.ts
// Tipos compartidos de la aplicación

export type Rol = "superusuario" | "jefe_departamento" | "miembro_departamento";
export type TipoActividad = "operativa" | "efemeride";
export type EstadoActividad =
  | "pendiente"
  | "en_progreso"
  | "completada"
  | "cancelada";
export type Prioridad = "baja" | "media" | "alta";
export type CanalNotificacion = "telegram" | "email" | "calendario";
export type EstadoNotificacion = "pendiente" | "enviada" | "fallida";

export interface Departamento {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  rol: Rol;
  cedula: string;
  telefono?: string;
  departamento_id: string;
  telegram_chat_id?: string;
  correo_google?: string;
  activo: boolean;
}

export interface Actividad {
  id: string;
  titulo: string;
  descripcion?: string;
  tipo: TipoActividad;
  fecha_inicio: Date; // Al leer de la BD, pg la convierte en Date
  fecha_fin?: Date;
  estado: EstadoActividad;
  prioridad: Prioridad;
  creado_por: string;
  asignado_a?: string;
  departamentos?: string[];
}

export interface Notificacion {
  id: string;
  actividad_id: string;
  usuario_id: string;
  canal: CanalNotificacion;
  estado: EstadoNotificacion;
  enviada_en?: Date;
  mensaje_error?: string;
}

export interface ConfiguracionNotificaciones {
  id: string;
  usuario_id: string;
  telegram_habilitado: boolean;
  email_habilitado: boolean;
  calendario_habilitado: boolean;
  dias_anticipacion: number;
}

// DTOs para crear/actualizar
export interface CrearActividadDTO {
  titulo: string;
  descripcion?: string;
  tipo: TipoActividad;
  fecha_inicio: string; // <-- ¡CAMBIO! de Date a string
  prioridad?: Prioridad;
  departamento_ids: string[];
}

export interface ActualizarActividadDTO {
  titulo?: string;
  descripcion?: string;
  estado?: EstadoActividad;
  prioridad?: Prioridad;
  asignado_a?: string;
  departamento_ids?: string[];
  tipo?: TipoActividad;
  fecha_inicio?: string; // <-- ¡CAMBIO! Añadido como string
}

export interface RegistroActividad {
  id: string;
  actividad_id: string;
  usuario_id: string;
  accion: "creada" | "actualizada" | "eliminada" | "cambio_estado";
  cambios?: Record<string, unknown>;
}
