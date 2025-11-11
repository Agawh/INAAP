// /services/actividades.service.ts
import { sql } from "@/lib/db";
import type {
  Actividad,
  CrearActividadDTO,
  ActualizarActividadDTO,
} from "@/types";

// --- ¡NUEVOS TIPOS! (Para los datos del Dashboard) ---
export type DashboardKPIs = {
  totalMes: number;
  enProgreso: number;
  pendientes: number;
};

export type ActividadSimple = Pick<
  Actividad,
  "id" | "titulo" | "fecha_inicio" | "estado"
>;

export type DashboardChartData = {
  estado: string;
  total: number;
};

export type DashboardData = {
  kpis: DashboardKPIs;
  proximasActividades: ActividadSimple[];
  chartData: DashboardChartData[];
};
// --- FIN DE NUEVOS TIPOS ---

export class ActividadesService {
  static async crear(
    datos: CrearActividadDTO,
    usuarioId: string
  ): Promise<Actividad> {
    try {
      // Construcción dinámica de la consulta para usar los DEFAULT de la BD

      const campos: string[] = [
        "titulo",
        "descripcion",
        "tipo",
        "fecha_inicio",
        "creado_por",
      ];
      const valores: any[] = [
        datos.titulo,
        datos.descripcion || null,
        datos.tipo,
        datos.fecha_inicio,
        usuarioId,
      ];

      // Añadimos los campos opcionales SOLO si vienen en el DTO
      if (datos.prioridad) {
        campos.push("prioridad");
        valores.push(datos.prioridad);
      }

      // Creamos los placeholders ($1, $2, $3...)
      const placeholders = campos.map((_, i) => `$${i + 1}`).join(", ");

      const queryActividad = `
        INSERT INTO actividades (${campos.join(", ")})
        VALUES (${placeholders})
        RETURNING *
      `;

      const resultActividad = await sql(queryActividad, valores);
      const actividad = resultActividad.rows[0] as Actividad;

      // Asociar departamentos
      if (datos.departamento_ids && datos.departamento_ids.length > 0) {
        for (const deptId of datos.departamento_ids) {
          const queryDept = `
            INSERT INTO actividades_departamentos (actividad_id, departamento_id)
            VALUES ($1, $2)
          `;
          await sql(queryDept, [actividad.id, deptId]);
        }
      }

      // Registrar en auditoría
      const queryAuditoria = `
        INSERT INTO registro_actividades (actividad_id, usuario_id, accion, cambios)
        VALUES ($1, $2, 'creada', $3)
      `;
      await sql(queryAuditoria, [
        actividad.id,
        usuarioId,
        JSON.stringify(datos),
      ]);

      return actividad;
    } catch (error) {
      console.error("[v0] Error creando actividad:", error);
      throw error;
    }
  }

  static async obtenerPorId(id: string): Promise<Actividad | null> {
    try {
      const query = `
        SELECT a.*, 
               array_agg(DISTINCT ad.departamento_id) as departamentos
        FROM actividades a
        LEFT JOIN actividades_departamentos ad ON a.id = ad.actividad_id
        WHERE a.id = $1
        GROUP BY a.id
        LIMIT 1
      `;
      const result = await sql(query, [id]);
      return result.rows.length > 0 ? (result.rows[0] as Actividad) : null;
    } catch (error) {
      console.error("[v0] Error obteniendo actividad:", error);
      throw error;
    }
  }

  static async obtenerPorDepartamento(
    departamentoId: string
  ): Promise<Actividad[]> {
    try {
      const query = `
        SELECT DISTINCT a.*, 
               array_agg(DISTINCT ad.departamento_id) as departamentos
        FROM actividades a
        LEFT JOIN actividades_departamentos ad ON a.id = ad.actividad_id
        WHERE ad.departamento_id = $1
        GROUP BY a.id
        ORDER BY a.fecha_inicio DESC
      `;
      const result = await sql(query, [departamentoId]);
      return result.rows as Actividad[];
    } catch (error) {
      console.error(
        "[v0] Error obteniendo actividades por departamento:",
        error
      );
      throw error;
    }
  }

  static async obtenerTodas(): Promise<Actividad[]> {
    try {
      const query = `
        SELECT a.*, 
               array_agg(DISTINCT ad.departamento_id) as departamentos
        FROM actividades a
        LEFT JOIN actividades_departamentos ad ON a.id = ad.actividad_id
        GROUP BY a.id
        ORDER BY a.fecha_inicio DESC
      `;
      const result = await sql(query);
      return result.rows as Actividad[];
    } catch (error) {
      console.error("[v0] Error obteniendo todas las actividades:", error);
      throw error;
    }
  }

  /**
   * Verifica si una actividad pertenece a un departamento específico.
   * Usado para la seguridad de las acciones de Jefes de Departamento.
   */
  static async verificarPertenencia(
    actividadId: string,
    departamentoId: string
  ): Promise<boolean> {
    try {
      const query = `
        SELECT 1 
        FROM actividades_departamentos
        WHERE actividad_id = $1 AND departamento_id = $2
        LIMIT 1
      `;
      const result = await sql(query, [actividadId, departamentoId]);
      return result.rows.length > 0; // true si encuentra coincidencia, false si no
    } catch (error) {
      console.error("[v0] Error verificando pertenencia:", error);
      return false;
    }
  }

  static async actualizar(
    id: string,
    datos: ActualizarActividadDTO,
    usuarioId: string
  ): Promise<Actividad> {
    try {
      // 1. Crear listas de parámetros separadas
      const setClause: string[] = [];
      const updateParams: any[] = []; // Parámetros SÓLO para el UPDATE
      let paramIndex = 1; // Empezar en $1

      // 2. Construir la consulta de UPDATE
      if (datos.titulo !== undefined) {
        setClause.push(`titulo = $${paramIndex}`);
        updateParams.push(datos.titulo);
        paramIndex++;
      }
      if (datos.descripcion !== undefined) {
        setClause.push(`descripcion = $${paramIndex}`);
        updateParams.push(datos.descripcion);
        paramIndex++;
      }
      if (datos.estado !== undefined) {
        setClause.push(`estado = $${paramIndex}`);
        updateParams.push(datos.estado);
        paramIndex++;
      }
      if (datos.prioridad !== undefined) {
        setClause.push(`prioridad = $${paramIndex}`);
        updateParams.push(datos.prioridad);
        paramIndex++;
      }
      if (datos.asignado_a !== undefined) {
        setClause.push(`asignado_a = $${paramIndex}`);
        updateParams.push(datos.asignado_a);
        paramIndex++;
      }

      if (datos.tipo !== undefined) {
        setClause.push(`tipo = $${paramIndex}`);
        updateParams.push(datos.tipo);
        paramIndex++;
      }

      // 3. Manejar el caso de que no haya campos para actualizar
      if (setClause.length === 0 && !datos.departamento_ids) {
        const actividad = await this.obtenerPorId(id);
        if (!actividad) throw new Error("Actividad no encontrada");
        return actividad;
      }

      // 4. Ejecutar la consulta de UPDATE (si hay campos)
      if (setClause.length > 0) {
        // Añadimos el 'id' al final de la lista de parámetros
        updateParams.push(id);

        // El 'id' será el último parámetro
        const queryUpdate = `
          UPDATE actividades
          SET ${setClause.join(", ")}
          WHERE id = $${paramIndex} 
          RETURNING *
        `;

        await sql(queryUpdate, updateParams);
      }

      // 5. Actualizar departamentos
      if (datos.departamento_ids) {
        await sql(
          `DELETE FROM actividades_departamentos WHERE actividad_id = $1`,
          [id]
        );

        for (const deptId of datos.departamento_ids) {
          const queryDept = `
            INSERT INTO actividades_departamentos (actividad_id, departamento_id)
            VALUES ($1, $2)
          `;
          await sql(queryDept, [id, deptId]);
        }
      }

      // 6. Registrar en auditoría
      const queryAuditoria = `
        INSERT INTO registro_actividades (actividad_id, usuario_id, accion, cambios)
        VALUES ($1, $2, 'actualizada', $3)
      `;
      await sql(queryAuditoria, [id, usuarioId, JSON.stringify(datos)]);

      // 7. Devolver la actividad actualizada
      const actividadActualizada = await this.obtenerPorId(id);
      if (!actividadActualizada)
        throw new Error("Actividad no encontrada después de actualizar");
      return actividadActualizada;
    } catch (error) {
      console.error("[v0] Error actualizando actividad:", error);
      throw error;
    }
  }

  // --- ¡FUNCIÓN 'obtenerDatosDashboard' CORREGIDA! ---
  /**
   * Obtiene todos los datos agregados para el Panel de Control principal.
   */
  static async obtenerDatosDashboard(): Promise<DashboardData> {
    try {
      // --- ¡CORRECCIÓN! Se cambió de 'sql`...`' a 'sql("...")' ---

      // 1. Consultas para los KPIs
      const kpiQueries = [
        // Total actividades en el mes actual
        sql(
          "SELECT COUNT(*) FROM actividades WHERE date_trunc('month', fecha_inicio) = date_trunc('month', CURRENT_DATE)"
        ),
        // Total en progreso (global)
        sql("SELECT COUNT(*) FROM actividades WHERE estado = $1", [
          "en_progreso",
        ]),
        // Total pendientes (global)
        sql("SELECT COUNT(*) FROM actividades WHERE estado = $1", [
          "pendiente",
        ]),
      ];

      // 2. Consulta para las próximas actividades (Top 5)
      const proximasQuery = sql(
        `SELECT id, titulo, fecha_inicio, estado
        FROM actividades
        WHERE estado = $1 AND fecha_inicio >= CURRENT_DATE
        ORDER BY fecha_inicio ASC
        LIMIT 5`,
        ["pendiente"]
      );

      // 3. Consulta para el gráfico (actividades del mes actual por estado)
      const chartQuery = sql(
        `SELECT estado, COUNT(*) as total
        FROM actividades
        WHERE date_trunc('month', fecha_inicio) = date_trunc('month', CURRENT_DATE)
        GROUP BY estado`
      );
      // --- FIN DE LA CORRECCIÓN ---

      // Ejecutamos todas las consultas en paralelo
      const [kpiResults, proximasResult, chartResult] = await Promise.all([
        Promise.all(kpiQueries),
        proximasQuery,
        chartQuery,
      ]);

      // 4. Procesamos los resultados
      const kpis: DashboardKPIs = {
        totalMes: parseInt(kpiResults[0].rows[0].count, 10) || 0,
        enProgreso: parseInt(kpiResults[1].rows[0].count, 10) || 0,
        pendientes: parseInt(kpiResults[2].rows[0].count, 10) || 0,
      };

      const proximasActividades: ActividadSimple[] = proximasResult.rows.map(
        (r: any) => ({
          id: r.id,
          titulo: r.titulo,
          fecha_inicio: r.fecha_inicio,
          estado: r.estado,
        })
      );

      const chartData: DashboardChartData[] = chartResult.rows.map(
        (r: any) => ({
          estado: r.estado,
          total: parseInt(r.total, 10),
        })
      );

      return {
        kpis,
        proximasActividades,
        chartData,
      };
    } catch (error) {
      console.error("[v0] Error obteniendo datos del dashboard:", error);
      // Devolvemos data vacía en caso de error
      return {
        kpis: { totalMes: 0, enProgreso: 0, pendientes: 0 },
        proximasActividades: [],
        chartData: [],
      };
    }
  }
}
