// /services/usuarios.service.ts
import { sql } from "@/lib/db";
import type { Usuario, ConfiguracionNotificaciones } from "@/types";

export class UsuariosService {
  static async obtenerTodos(): Promise<Usuario[]> {
    try {
      // ---- Sintaxis SQL corregida ----
      const query = `
        SELECT id, email, nombre_completo, rol, departamento_id, telegram_chat_id, correo_google, activo
        FROM usuarios
        WHERE activo = true
        ORDER BY nombre_completo ASC
      `;
      const result = await sql(query);
      return result.rows as Usuario[];
    } catch (error) {
      console.error("[v0] Error obteniendo usuarios:", error);
      throw error;
    }
  }

  static async obtenerPorDepartamento(
    departamentoId: string
  ): Promise<Usuario[]> {
    try {
      // ---- Sintaxis SQL corregida ----
      const query = `
        SELECT id, email, nombre_completo, rol, departamento_id, telegram_chat_id, correo_google, activo
        FROM usuarios
        WHERE departamento_id = $1 AND activo = true
        ORDER BY nombre_completo ASC
      `;
      const result = await sql(query, [departamentoId]);
      return result.rows as Usuario[];
    } catch (error) {
      console.error("[v0] Error obteniendo usuarios por departamento:", error);
      throw error;
    }
  }

  static async actualizarConfiguracionNotificaciones(
    usuarioId: string,
    config: Partial<ConfiguracionNotificaciones>
  ): Promise<ConfiguracionNotificaciones> {
    try {
      // ---- Sintaxis SQL corregida ----
      const query = `
        UPDATE configuracion_notificaciones
        SET 
          telegram_habilitado = COALESCE($1, telegram_habilitado),
          email_habilitado = COALESCE($2, email_habilitado),
          calendario_habilitado = COALESCE($3, calendario_habilitado),
          dias_anticipacion = COALESCE($4, dias_anticipacion)
        WHERE usuario_id = $5
        RETURNING *
      `;
      const params = [
        config.telegram_habilitado,
        config.email_habilitado,
        config.calendario_habilitado,
        config.dias_anticipacion,
        usuarioId,
      ];
      const result = await sql(query, params);
      return result.rows[0] as ConfiguracionNotificaciones;
    } catch (error) {
      console.error(
        "[v0] Error actualizando configuración de notificaciones:",
        error
      );
      throw error;
    }
  }

  static async obtenerConfiguracionNotificaciones(
    usuarioId: string
  ): Promise<ConfiguracionNotificaciones | null> {
    try {
      // ---- Sintaxis SQL corregida ----
      const query = `
        SELECT id, usuario_id, telegram_habilitado, email_habilitado, calendario_habilitado, dias_anticipacion
        FROM configuracion_notificaciones
        WHERE usuario_id = $1
        LIMIT 1
      `;
      const result = await sql(query, [usuarioId]);
      return result.rows.length > 0
        ? (result.rows[0] as ConfiguracionNotificaciones)
        : null;
    } catch (error) {
      console.error(
        "[v0] Error obteniendo configuración de notificaciones:",
        error
      );
      throw error;
    }
  }
}
