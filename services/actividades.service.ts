import { sql } from "@/lib/db"
import type { Actividad, CrearActividadDTO, ActualizarActividadDTO } from "@/types"

export class ActividadesService {
  static async crear(datos: CrearActividadDTO, usuarioId: string): Promise<Actividad> {
    try {
      // Crear actividad
      const resultActividad = await sql`
        INSERT INTO actividades (titulo, descripcion, tipo, fecha_inicio, fecha_fin, estado, prioridad, creado_por, asignado_a)
        VALUES (${datos.titulo}, ${datos.descripcion || null}, ${datos.tipo}, ${datos.fecha_inicio}, 
                ${datos.fecha_fin || null}, 'pendiente', ${datos.prioridad}, ${usuarioId}, ${datos.asignado_a || null})
        RETURNING *
      `

      const actividad = resultActividad[0] as Actividad

      // Asociar departamentos
      if (datos.departamento_ids && datos.departamento_ids.length > 0) {
        for (const deptId of datos.departamento_ids) {
          await sql`
            INSERT INTO actividades_departamentos (actividad_id, departamento_id)
            VALUES (${actividad.id}, ${deptId})
          `
        }
      }

      // Registrar en auditoría
      await sql`
        INSERT INTO registro_actividades (actividad_id, usuario_id, accion, cambios)
        VALUES (${actividad.id}, ${usuarioId}, 'creada', ${JSON.stringify(datos)})
      `

      return actividad
    } catch (error) {
      console.error("[v0] Error creando actividad:", error)
      throw error
    }
  }

  static async obtenerPorId(id: string): Promise<Actividad | null> {
    try {
      const result = await sql`
        SELECT a.*, 
               array_agg(DISTINCT ad.departamento_id) as departamentos
        FROM actividades a
        LEFT JOIN actividades_departamentos ad ON a.id = ad.actividad_id
        WHERE a.id = ${id}
        GROUP BY a.id
        LIMIT 1
      `

      return result.length > 0 ? (result[0] as Actividad) : null
    } catch (error) {
      console.error("[v0] Error obteniendo actividad:", error)
      throw error
    }
  }

  static async obtenerPorDepartamento(departamentoId: string): Promise<Actividad[]> {
    try {
      const result = await sql`
        SELECT DISTINCT a.*, 
               array_agg(DISTINCT ad.departamento_id) as departamentos
        FROM actividades a
        LEFT JOIN actividades_departamentos ad ON a.id = ad.actividad_id
        WHERE ad.departamento_id = ${departamentoId}
        GROUP BY a.id
        ORDER BY a.fecha_inicio DESC
      `

      return result as Actividad[]
    } catch (error) {
      console.error("[v0] Error obteniendo actividades por departamento:", error)
      throw error
    }
  }

  static async obtenerTodas(): Promise<Actividad[]> {
    try {
      const result = await sql`
        SELECT a.*, 
               array_agg(DISTINCT ad.departamento_id) as departamentos
        FROM actividades a
        LEFT JOIN actividades_departamentos ad ON a.id = ad.actividad_id
        GROUP BY a.id
        ORDER BY a.fecha_inicio DESC
      `

      return result as Actividad[]
    } catch (error) {
      console.error("[v0] Error obteniendo todas las actividades:", error)
      throw error
    }
  }

  static async actualizar(id: string, datos: ActualizarActividadDTO, usuarioId: string): Promise<Actividad> {
    try {
      const setClause = []
      const params = [id, usuarioId, JSON.stringify(datos)]
      let paramIndex = 4

      if (datos.titulo !== undefined) {
        setClause.push(`titulo = $${paramIndex}`)
        params.push(datos.titulo)
        paramIndex++
      }
      if (datos.descripcion !== undefined) {
        setClause.push(`descripcion = $${paramIndex}`)
        params.push(datos.descripcion)
        paramIndex++
      }
      if (datos.estado !== undefined) {
        setClause.push(`estado = $${paramIndex}`)
        params.push(datos.estado)
        paramIndex++
      }
      if (datos.prioridad !== undefined) {
        setClause.push(`prioridad = $${paramIndex}`)
        params.push(datos.prioridad)
        paramIndex++
      }
      if (datos.asignado_a !== undefined) {
        setClause.push(`asignado_a = $${paramIndex}`)
        params.push(datos.asignado_a)
        paramIndex++
      }

      if (setClause.length === 0) {
        const actividad = await this.obtenerPorId(id)
        if (!actividad) throw new Error("Actividad no encontrada")
        return actividad
      }

      const query = `
        UPDATE actividades
        SET ${setClause.join(", ")}
        WHERE id = $1
        RETURNING *
      `

      const result = await sql(query, params)
      const actividad = result[0] as Actividad

      // Actualizar departamentos si se proporciona
      if (datos.departamento_ids) {
        await sql`DELETE FROM actividades_departamentos WHERE actividad_id = ${id}`

        for (const deptId of datos.departamento_ids) {
          await sql`
            INSERT INTO actividades_departamentos (actividad_id, departamento_id)
            VALUES (${id}, ${deptId})
          `
        }
      }

      // Registrar en auditoría
      await sql`
        INSERT INTO registro_actividades (actividad_id, usuario_id, accion, cambios)
        VALUES (${id}, ${usuarioId}, 'actualizada', ${JSON.stringify(datos)})
      `

      return actividad
    } catch (error) {
      console.error("[v0] Error actualizando actividad:", error)
      throw error
    }
  }
}
