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

export type ResultadoPaginado<T> = {
  datos: T[];
  total: number;
  paginas: number;
  paginaActual: number;
};

export class AuditoriaService {
  /**
   * Obtiene los cambios de actividades con filtro de fecha opcional
   */
  static async obtenerCambiosPaginados(
    pagina: number = 1,
    limite: number = 15,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<ResultadoPaginado<LogAuditoria>> {
    try {
      const offset = (pagina - 1) * limite;
      const paramsData: any[] = [limite, offset];
      const paramsCount: any[] = [];

      // Construcción dinámica del WHERE para fechas
      let whereClause = "";
      if (fechaInicio && fechaFin) {
        // Asumimos formato YYYY-MM-DD. Agregamos horas para cubrir el día completo.
        whereClause = "WHERE ra.fecha_cambio BETWEEN $3 AND $4";
        // Ajuste para incluir el final del día de la fecha fin
        paramsCount.push(`${fechaInicio} 00:00:00`, `${fechaFin} 23:59:59`);
        paramsData.push(`${fechaInicio} 00:00:00`, `${fechaFin} 23:59:59`);
      }

      // 1. Contar total con filtro
      const queryTotal = `SELECT COUNT(*) as total FROM registro_actividades ra ${whereClause}`;
      // Para el count, los parámetros son $1 y $2 si existen
      const paramsCountFinal = whereClause ? paramsCount : [];
      // Reajustamos índices para el count si es necesario (el driver de pg maneja arrays posicionales)
      // Truco: sql() espera array. Si whereClause usa $3 y $4, debemos pasar [null, null, f1, f2] o reescribir query.
      // Para simplificar, reescribimos la query de count para usar $1 y $2
      const queryTotalReescrita = whereClause
        ? `SELECT COUNT(*) as total FROM registro_actividades ra WHERE ra.fecha_cambio BETWEEN $1 AND $2`
        : `SELECT COUNT(*) as total FROM registro_actividades ra`;

      const resultTotal = await sql(queryTotalReescrita, paramsCount);
      const total = parseInt(resultTotal.rows[0].total, 10);
      const totalPaginas = Math.ceil(total / limite);

      // 2. Obtener datos
      const query = `
        SELECT 
          ra.id,
          u.nombre_completo as usuario,
          ra.accion,
          COALESCE(a.titulo, 'Actividad eliminada') as actividad,
          ra.fecha_cambio,
          ra.cambios
        FROM registro_actividades ra
        LEFT JOIN usuarios u ON ra.usuario_id = u.id
        LEFT JOIN actividades a ON ra.actividad_id = a.id
        ${whereClause ? "WHERE ra.fecha_cambio BETWEEN $3 AND $4" : ""}
        ORDER BY ra.fecha_cambio DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await sql(query, paramsData);

      const datos = result.rows.map((row: any) => ({
        id: row.id,
        usuario: row.usuario || "Usuario desconocido",
        accion: row.accion,
        actividad: row.actividad,
        fecha: row.fecha_cambio ? new Date(row.fecha_cambio) : new Date(),
        detalles: row.cambios,
      }));

      return { datos, total, paginas: totalPaginas, paginaActual: pagina };
    } catch (error) {
      console.error("Error obteniendo auditoría:", error);
      return { datos: [], total: 0, paginas: 0, paginaActual: 1 };
    }
  }

  /**
   * Obtiene notificaciones con filtro de fecha
   */
  static async obtenerNotificacionesPaginadas(
    pagina: number = 1,
    limite: number = 15,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<ResultadoPaginado<LogNotificacion>> {
    try {
      const offset = (pagina - 1) * limite;
      const paramsData: any[] = [limite, offset];
      const paramsCount: any[] = [];

      let whereClause = "";
      if (fechaInicio && fechaFin) {
        whereClause = "WHERE n.enviada_en BETWEEN $3 AND $4";
        paramsCount.push(`${fechaInicio} 00:00:00`, `${fechaFin} 23:59:59`);
        paramsData.push(`${fechaInicio} 00:00:00`, `${fechaFin} 23:59:59`);
      }

      const queryTotalReescrita = whereClause
        ? `SELECT COUNT(*) as total FROM notificaciones n WHERE n.enviada_en BETWEEN $1 AND $2`
        : `SELECT COUNT(*) as total FROM notificaciones n`;

      const resultTotal = await sql(queryTotalReescrita, paramsCount);
      const total = parseInt(resultTotal.rows[0].total, 10);
      const totalPaginas = Math.ceil(total / limite);

      const query = `
        SELECT 
          n.id,
          u.nombre_completo as usuario,
          n.canal,
          n.estado,
          COALESCE(a.titulo, 'Actividad eliminada') as actividad,
          n.enviada_en,
          n.mensaje_error
        FROM notificaciones n
        LEFT JOIN usuarios u ON n.usuario_id = u.id
        LEFT JOIN actividades a ON n.actividad_id = a.id
        ${whereClause ? "WHERE n.enviada_en BETWEEN $3 AND $4" : ""}
        ORDER BY n.enviada_en DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await sql(query, paramsData);

      const datos = result.rows.map((row: any) => ({
        id: row.id,
        usuario: row.usuario || "Usuario desconocido",
        canal: row.canal,
        estado: row.estado,
        actividad: row.actividad,
        fecha: new Date(row.enviada_en),
        error: row.mensaje_error,
      }));

      return { datos, total, paginas: totalPaginas, paginaActual: pagina };
    } catch (error) {
      console.error("Error obteniendo notificaciones:", error);
      return { datos: [], total: 0, paginas: 0, paginaActual: 1 };
    }
  }
}
