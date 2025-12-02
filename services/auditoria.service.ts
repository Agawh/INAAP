// /services/auditoria.service.ts
import { sql } from "@/lib/db";

export interface LogAuditoria {
  id: string;
  usuario: string;
  accion: string;
  actividad: string;
  fecha: Date;
  detalles: any;
}

export interface LogNotificacion {
  id: string;
  usuario: string;
  canal: string;
  estado: string;
  actividad: string;
  fecha: Date;
  error?: string;
}

export class AuditoriaService {
  /**
   * Obtiene los últimos movimientos de actividades (Creación, Edición, Eliminación)
   */
  static async obtenerUltimosCambios(limite = 50): Promise<LogAuditoria[]> {
    try {
      const query = `
        SELECT 
          ra.id,
          u.nombre_completo as usuario,
          ra.accion,
          COALESCE(a.titulo, 'Actividad Eliminada') as actividad,
          ra.id as fecha_id, -- Simulamos orden por ID si no hay timestamp
          ra.cambios
        FROM registro_actividades ra
        LEFT JOIN usuarios u ON ra.usuario_id = u.id
        LEFT JOIN actividades a ON ra.actividad_id = a.id
        ORDER BY ra.id DESC
        LIMIT $1
      `;

      const result = await sql(query, [limite]);

      return result.rows.map((row: any) => ({
        id: row.id,
        usuario: row.usuario || "Usuario Desconocido",
        accion: row.accion,
        actividad: row.actividad,
        fecha: new Date(), // Nota: Idealmente agregarías 'created_at' a la tabla registro_actividades
        detalles: row.cambios,
      }));
    } catch (error) {
      console.error("Error obteniendo auditoría:", error);
      return [];
    }
  }

  /**
   * Obtiene el historial de notificaciones enviadas
   */
  static async obtenerHistorialNotificaciones(
    limite = 50
  ): Promise<LogNotificacion[]> {
    try {
      const query = `
        SELECT 
          n.id,
          u.nombre_completo as usuario,
          n.canal,
          n.estado,
          a.titulo as actividad,
          n.enviada_en,
          n.mensaje_error
        FROM notificaciones n
        LEFT JOIN usuarios u ON n.usuario_id = u.id
        LEFT JOIN actividades a ON n.actividad_id = a.id
        ORDER BY n.enviada_en DESC
        LIMIT $1
      `;

      const result = await sql(query, [limite]);

      return result.rows.map((row: any) => ({
        id: row.id,
        usuario: row.usuario || "Usuario Desconocido",
        canal: row.canal,
        estado: row.estado,
        actividad: row.actividad || "Actividad Eliminada",
        fecha: new Date(row.enviada_en),
        error: row.mensaje_error,
      }));
    } catch (error) {
      console.error("Error obteniendo notificaciones:", error);
      return [];
    }
  }
}
