// /services/usuarios.service.ts
import { sql } from "@/lib/db";
import type { Usuario, ConfiguracionNotificaciones } from "@/types";

export class UsuariosService {
  // --- ¡ACTUALIZADO! Con filtro y JOIN ---
  static async obtenerTodos(filtro?: string): Promise<Usuario[]> {
    try {
      let query = `
        SELECT u.id, u.email, u.nombre_completo, u.rol, u.departamento_id, 
               u.telegram_chat_id, u.correo_google, u.activo, u.cedula
        FROM usuarios u
        LEFT JOIN departamentos d ON u.departamento_id = d.id
        WHERE u.activo = true
      `;
      const params: string[] = [];

      if (filtro) {
        // Añadimos la lógica de búsqueda por nombre, email, cédula o departamento
        query += ` AND (
          u.nombre_completo ILIKE $1 OR 
          u.email ILIKE $1 OR
          u.cedula ILIKE $1 OR
          d.nombre ILIKE $1
        )`;
        params.push(`%${filtro}%`); // ILIKE con '%' busca patrones
      }

      query += ` ORDER BY u.nombre_completo ASC`;

      const result = await sql(query, params);
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
      // --- ¡ACTUALIZADO! (Añadido 'cedula') ---
      const query = `
        SELECT id, email, nombre_completo, rol, departamento_id, telegram_chat_id, correo_google, activo, cedula
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
