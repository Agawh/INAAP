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
      // --- SECCIÓN ACTUALIZADA ---
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
      // Si no vienen, la BD usará el DEFAULT ('media', null, null)
      if (datos.prioridad) {
        campos.push("prioridad");
        valores.push(datos.prioridad);
      }

      // (Mantenemos la lógica por si en el futuro se vuelve a añadir)
      // if (datos.fecha_fin) {
      //   campos.push('fecha_fin');
      //   valores.push(datos.fecha_fin);
      // }
      // if (datos.asignado_a) {
      //   campos.push('asignado_a');
      //   valores.push(datos.asignado_a);
      // }

      // Creamos los placeholders ($1, $2, $3...)
      const placeholders = campos.map((_, i) => `$${i + 1}`).join(", ");

      const queryActividad = `
        INSERT INTO actividades (${campos.join(", ")})
        VALUES (${placeholders})
        RETURNING *
      `;
      // --- FIN DE SECCIÓN ACTUALIZADA ---

      const resultActividad = await sql(queryActividad, valores);
      const actividad = resultActividad.rows[0] as Actividad;

      // Asociar departamentos (sin cambios)
      if (datos.departamento_ids && datos.departamento_ids.length > 0) {
        for (const deptId of datos.departamento_ids) {
          const queryDept = `
            INSERT INTO actividades_departamentos (actividad_id, departamento_id)
            VALUES ($1, $2)
          `;
          await sql(queryDept, [actividad.id, deptId]);
        }
      }

      // Registrar en auditoría (sin cambios)
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

  static async actualizar(
    id: string,
    datos: ActualizarActividadDTO,
    usuarioId: string
  ): Promise<Actividad> {
    try {
      const setClause = [];
      const params: any[] = [id, usuarioId, JSON.stringify(datos)];
      let paramIndex = 4;

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
        const queryUpdate = `
          UPDATE actividades
          SET ${setClause.join(", ")}
          WHERE id = $1
          RETURNING *
        `;
        await sql(queryUpdate, params);
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
}
