import { sql } from "@/lib/db"
import type { Usuario, ConfiguracionNotificaciones } from "@/types"

export class UsuariosService {
  static async obtenerTodos(): Promise<Usuario[]> {
    try {
      const result = await sql`
        SELECT id, email, nombre_completo, rol, departamento_id, telegram_chat_id, correo_google, activo
        FROM usuarios
        WHERE activo = true
        ORDER BY nombre_completo ASC
      `

      return result as Usuario[]
    } catch (error) {
      console.error("[v0] Error obteniendo usuarios:", error)
      throw error
    }
  }

  static async obtenerPorDepartamento(departamentoId: string): Promise<Usuario[]> {
    try {
      const result = await sql`
        SELECT id, email, nombre_completo, rol, departamento_id, telegram_chat_id, correo_google, activo
        FROM usuarios
        WHERE departamento_id = ${departamentoId} AND activo = true
        ORDER BY nombre_completo ASC
      `

      return result as Usuario[]
    } catch (error) {
      console.error("[v0] Error obteniendo usuarios por departamento:", error)
      throw error
    }
  }

  static async actualizarConfiguracionNotificaciones(
    usuarioId: string,
    config: Partial<ConfiguracionNotificaciones>,
  ): Promise<ConfiguracionNotificaciones> {
    try {
      const result = await sql`
        UPDATE configuracion_notificaciones
        SET 
          telegram_habilitado = COALESCE(${config.telegram_habilitado}, telegram_habilitado),
          email_habilitado = COALESCE(${config.email_habilitado}, email_habilitado),
          calendario_habilitado = COALESCE(${config.calendario_habilitado}, calendario_habilitado),
          dias_anticipacion = COALESCE(${config.dias_anticipacion}, dias_anticipacion)
        WHERE usuario_id = ${usuarioId}
        RETURNING *
      `

      return result[0] as ConfiguracionNotificaciones
    } catch (error) {
      console.error("[v0] Error actualizando configuración de notificaciones:", error)
      throw error
    }
  }

  static async obtenerConfiguracionNotificaciones(usuarioId: string): Promise<ConfiguracionNotificaciones | null> {
    try {
      const result = await sql`
        SELECT id, usuario_id, telegram_habilitado, email_habilitado, calendario_habilitado, dias_anticipacion
        FROM configuracion_notificaciones
        WHERE usuario_id = ${usuarioId}
        LIMIT 1
      `

      return result.length > 0 ? (result[0] as ConfiguracionNotificaciones) : null
    } catch (error) {
      console.error("[v0] Error obteniendo configuración de notificaciones:", error)
      throw error
    }
  }
}
