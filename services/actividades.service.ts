// /services/actividades.service.ts
import { sql } from "@/lib/db";
import type {
  Actividad,
  CrearActividadDTO,
  ActualizarActividadDTO,
} from "@/types";

export class ActividadesService {
  static async crear(
    datos: CrearActividadDTO,
    usuarioId: string
  ): Promise<Actividad> {
    try {
      // Crear actividad
      // ---- Sintaxis SQL corregida ----
      const queryActividad = `
        INSERT INTO actividades (titulo, descripcion, tipo, fecha_inicio, fecha_fin, estado, prioridad, creado_por, asignado_a)
        VALUES ($1, $2, $3, $4, $5, 'pendiente', $6, $7, $8)
        RETURNING *
      `;
      const paramsActividad = [
        datos.titulo,
        datos.descripcion || null,
        datos.tipo,
        datos.fecha_inicio,
        datos.fecha_fin || null,
        datos.prioridad,
        usuarioId,
        datos.asignado_a || null,
      ];
      const resultActividad = await sql(queryActividad, paramsActividad);
      const actividad = resultActividad.rows[0] as Actividad;

      // Asociar departamentos
      if (datos.departamento_ids && datos.departamento_ids.length > 0) {
        for (const deptId of datos.departamento_ids) {
          // ---- Sintaxis SQL corregida ----
          const queryDept = `
            INSERT INTO actividades_departamentos (actividad_id, departamento_id)
            VALUES ($1, $2)
          `;
          await sql(queryDept, [actividad.id, deptId]);
        }
      }

      // Registrar en auditoría
      // ---- Sintaxis SQL corregida ----
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
      // ---- Sintaxis SQL corregida ----
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
      // ---- Sintaxis SQL corregida ----
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
      // ---- Sintaxis SQL corregida ----
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

  static async actualizar(
    id: string,
    datos: ActualizarActividadDTO,
    usuarioId: string
  ): Promise<Actividad> {
    try {
      const setClause = [];
      const params: any[] = [id, usuarioId, JSON.stringify(datos)]; // Iniciar params con los que se usarán después
      let paramIndex = 4; // Empezar en $4

      if (datos.titulo !== undefined) {
        setClause.push(`titulo = $${paramIndex}`);
        params.push(datos.titulo);
        paramIndex++;
      }
      if (datos.descripcion !== undefined) {
        setClause.push(`descripcion = $${paramIndex}`);
        params.push(datos.descripcion);
        paramIndex++;
      }
      if (datos.estado !== undefined) {
        setClause.push(`estado = $${paramIndex}`);
        params.push(datos.estado);
        paramIndex++;
      }
      if (datos.prioridad !== undefined) {
        setClause.push(`prioridad = $${paramIndex}`);
        params.push(datos.prioridad);
        paramIndex++;
      }
      if (datos.asignado_a !== undefined) {
        setClause.push(`asignado_a = $${paramIndex}`);
        params.push(datos.asignado_a);
        paramIndex++;
      }

      if (setClause.length === 0 && !datos.departamento_ids) {
        const actividad = await this.obtenerPorId(id);
        if (!actividad) throw new Error("Actividad no encontrada");
        return actividad;
      }

      if (setClause.length > 0) {
        // ---- Sintaxis SQL corregida ----
        const queryUpdate = `
          UPDATE actividades
          SET ${setClause.join(", ")}
          WHERE id = $1
          RETURNING *
        `;
        await sql(queryUpdate, params);
      }

      // Actualizar departamentos si se proporciona
      if (datos.departamento_ids) {
        await sql(
          `DELETE FROM actividades_departamentos WHERE actividad_id = $1`,
          [id]
        );

        for (const deptId of datos.departamento_ids) {
          // ---- Sintaxis SQL corregida ----
          const queryDept = `
            INSERT INTO actividades_departamentos (actividad_id, departamento_id)
            VALUES ($1, $2)
          `;
          await sql(queryDept, [id, deptId]);
        }
      }

      // Registrar en auditoría
      // ---- Sintaxis SQL corregida ----
      const queryAuditoria = `
        INSERT INTO registro_actividades (actividad_id, usuario_id, accion, cambios)
        VALUES ($1, $2, 'actualizada', $3)
      `;
      await sql(queryAuditoria, [id, usuarioId, JSON.stringify(datos)]);

      // Devolver la actividad actualizada
      const actividadActualizada = await this.obtenerPorId(id);
      if (!actividadActualizada)
        throw new Error("Actividad no encontrada después de actualizar");
      return actividadActualizada;
    } catch (error) {
      console.error("[v0] Error actualizando actividad:", error);
      throw error;
    }
  }
}
