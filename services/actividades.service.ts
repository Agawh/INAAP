// /services/actividades.service.ts
import { sql } from "@/lib/db";
import type {
  Actividad,
  CrearActividadDTO,
  ActualizarActividadDTO,
} from "@/types";

// Tipos auxiliares para respuestas crudas de la BD
interface CountResult {
  total: string; // Postgres devuelve COUNT como string
}

interface ChartResult {
  estado: string;
  total: string;
}

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

export type ResultadoPaginado<T> = {
  datos: T[];
  total: number;
  paginas: number;
  paginaActual: number;
};

export class ActividadesService {
  static async obtenerPaginadas(
    pagina: number = 1,
    limite: number = 10,
    filtro: string = ""
  ): Promise<ResultadoPaginado<Actividad>> {
    try {
      const offset = (pagina - 1) * limite;

      const paramsData: any[] = [];
      const paramsCount: any[] = [];

      let condicionWhere = "";

      if (filtro) {
        condicionWhere = `
          WHERE (
            a.titulo ILIKE $1 OR 
            a.descripcion ILIKE $1 OR
            a.tipo ILIKE $1 OR
            d.nombre ILIKE $1
          )
        `;
        paramsCount.push(`%${filtro}%`);
        paramsData.push(`%${filtro}%`);
      }

      paramsData.push(limite);
      paramsData.push(offset);

      const idxLimit = filtro ? "$2" : "$1";
      const idxOffset = filtro ? "$3" : "$2";

      // Usamos el tipo genérico <CountResult>
      const queryTotal = `
        SELECT COUNT(DISTINCT a.id) as total
        FROM actividades a
        LEFT JOIN actividades_departamentos ad ON a.id = ad.actividad_id
        LEFT JOIN departamentos d ON ad.departamento_id = d.id
        ${condicionWhere}
      `;

      const resultTotal = await sql<CountResult>(queryTotal, paramsCount);
      const total = parseInt(resultTotal.rows[0].total, 10);
      const totalPaginas = Math.ceil(total / limite);

      // Usamos el tipo genérico <Actividad>
      const queryData = `
        SELECT a.*, 
               array_agg(DISTINCT ad.departamento_id) as departamentos
        FROM actividades a
        LEFT JOIN actividades_departamentos ad ON a.id = ad.actividad_id
        LEFT JOIN departamentos d ON ad.departamento_id = d.id
        ${condicionWhere}
        GROUP BY a.id
        ORDER BY a.fecha_inicio DESC
        LIMIT ${idxLimit} OFFSET ${idxOffset}
      `;

      const resultData = await sql<Actividad>(queryData, paramsData);

      return {
        datos: resultData.rows,
        total,
        paginas: totalPaginas,
        paginaActual: pagina,
      };
    } catch (error) {
      console.error("[ActividadesService] Error obteniendo paginadas:", error);
      throw error;
    }
  }

  static async crear(
    datos: CrearActividadDTO,
    usuarioId: string
  ): Promise<Actividad> {
    try {
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

      if (datos.prioridad) {
        campos.push("prioridad");
        valores.push(datos.prioridad);
      }

      const placeholders = campos.map((_, i) => `$${i + 1}`).join(", ");

      const queryActividad = `
        INSERT INTO actividades (${campos.join(", ")})
        VALUES (${placeholders})
        RETURNING *
      `;

      const resultActividad = await sql<Actividad>(queryActividad, valores);
      const actividad = resultActividad.rows[0];

      if (datos.departamento_ids && datos.departamento_ids.length > 0) {
        for (const deptId of datos.departamento_ids) {
          const queryDept = `
            INSERT INTO actividades_departamentos (actividad_id, departamento_id)
            VALUES ($1, $2)
          `;
          await sql(queryDept, [actividad.id, deptId]);
        }
      }

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
      const result = await sql<Actividad>(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
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
      const result = await sql<Actividad>(query, [departamentoId]);
      return result.rows;
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
      const result = await sql<Actividad>(query);
      return result.rows;
    } catch (error) {
      console.error("[v0] Error obteniendo todas las actividades:", error);
      throw error;
    }
  }

  static async verificarPertenencia(
    actividadId: string,
    departamentoId: string
  ): Promise<boolean> {
    try {
      // Usamos una interfaz simple para saber si existe
      const query = `
        SELECT 1 as existe
        FROM actividades_departamentos
        WHERE actividad_id = $1 AND departamento_id = $2
        LIMIT 1
      `;
      const result = await sql<{ existe: number }>(query, [
        actividadId,
        departamentoId,
      ]);
      return result.rows.length > 0;
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
      const setClause: string[] = [];
      const updateParams: any[] = [];
      let paramIndex = 1;

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
      if (datos.fecha_inicio !== undefined) {
        setClause.push(`fecha_inicio = $${paramIndex}`);
        updateParams.push(datos.fecha_inicio);
        paramIndex++;
      }

      if (setClause.length === 0 && !datos.departamento_ids) {
        const actividad = await this.obtenerPorId(id);
        if (!actividad) throw new Error("Actividad no encontrada");
        return actividad;
      }

      if (setClause.length > 0) {
        updateParams.push(id);
        const queryUpdate = `
          UPDATE actividades
          SET ${setClause.join(", ")}
          WHERE id = $${paramIndex} 
          RETURNING *
        `;
        await sql(queryUpdate, updateParams);
      }

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

      const queryAuditoria = `
        INSERT INTO registro_actividades (actividad_id, usuario_id, accion, cambios)
        VALUES ($1, $2, 'actualizada', $3)
      `;
      await sql(queryAuditoria, [id, usuarioId, JSON.stringify(datos)]);

      const actividadActualizada = await this.obtenerPorId(id);
      if (!actividadActualizada)
        throw new Error("Actividad no encontrada después de actualizar");
      return actividadActualizada;
    } catch (error) {
      console.error("[v0] Error actualizando actividad:", error);
      throw error;
    }
  }

  static async obtenerDatosDashboard(): Promise<DashboardData> {
    try {
      // Tipamos específicamente las respuestas
      const kpiQueries = [
        sql<CountResult>(
          "SELECT COUNT(*) as total FROM actividades WHERE date_trunc('month', fecha_inicio) = date_trunc('month', CURRENT_DATE)"
        ),
        sql<CountResult>(
          "SELECT COUNT(*) as total FROM actividades WHERE estado = $1",
          ["en_progreso"]
        ),
        sql<CountResult>(
          "SELECT COUNT(*) as total FROM actividades WHERE estado = $1",
          ["pendiente"]
        ),
      ];

      const proximasQuery = sql<Actividad>(
        `SELECT id, titulo, fecha_inicio, estado
        FROM actividades
        WHERE estado = $1 AND fecha_inicio >= CURRENT_DATE
        ORDER BY fecha_inicio ASC
        LIMIT 5`,
        ["pendiente"]
      );

      const chartQuery = sql<ChartResult>(
        `SELECT estado, COUNT(*) as total
        FROM actividades
        WHERE date_trunc('month', fecha_inicio) = date_trunc('month', CURRENT_DATE)
        GROUP BY estado`
      );

      const [kpiResults, proximasResult, chartResult] = await Promise.all([
        Promise.all(kpiQueries),
        proximasQuery,
        chartQuery,
      ]);

      const kpis: DashboardKPIs = {
        totalMes: parseInt(kpiResults[0].rows[0].total, 10) || 0,
        enProgreso: parseInt(kpiResults[1].rows[0].total, 10) || 0,
        pendientes: parseInt(kpiResults[2].rows[0].total, 10) || 0,
      };

      const proximasActividades: ActividadSimple[] = proximasResult.rows.map(
        (r) => ({
          id: r.id,
          titulo: r.titulo,
          fecha_inicio: r.fecha_inicio,
          estado: r.estado,
        })
      );

      const chartData: DashboardChartData[] = chartResult.rows.map((r) => ({
        estado: r.estado,
        total: parseInt(r.total, 10),
      }));

      return { kpis, proximasActividades, chartData };
    } catch (error) {
      console.error("[v0] Error obteniendo datos del dashboard:", error);
      return {
        kpis: { totalMes: 0, enProgreso: 0, pendientes: 0 },
        proximasActividades: [],
        chartData: [],
      };
    }
  }

  static async obtenerParaCalendario(): Promise<Actividad[]> {
    try {
      const query = `
        SELECT *
        FROM actividades 
        WHERE estado != 'cancelada'
        AND fecha_inicio >= (CURRENT_DATE - INTERVAL '1 month')
        ORDER BY fecha_inicio ASC
      `;
      const result = await sql<Actividad>(query);
      return result.rows;
    } catch (error) {
      console.error(
        "[v0] Error obteniendo actividades para calendario:",
        error
      );
      return [];
    }
  }
}
