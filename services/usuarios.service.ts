// /services/usuarios.service.ts
import { sql } from "@/lib/db";
import type { Usuario, ConfiguracionNotificaciones } from "@/types";
import { hashPassword, verifyPassword } from "@/lib/auth";

// Interfaz para la verificación de password (ya que solo trae hash)
interface PasswordCheckResult {
  password_hash: string;
}

export class UsuariosService {
  static async obtenerTodos(filtro?: string): Promise<Usuario[]> {
    try {
      let query = `
        SELECT u.id, u.email, u.nombre_completo, u.rol, u.departamento_id, 
               u.telegram_chat_id, u.correo_google, u.activo, u.cedula, u.telefono
        FROM usuarios u
        LEFT JOIN departamentos d ON u.departamento_id = d.id
        WHERE u.activo = true
      `;
      const params: string[] = [];

      if (filtro) {
        query += ` AND (
          u.nombre_completo ILIKE $1 OR 
          u.email ILIKE $1 OR
          u.cedula ILIKE $1 OR
          d.nombre ILIKE $1
        )`;
        params.push(`%${filtro}%`);
      }
      query += ` ORDER BY u.nombre_completo ASC`;
      const result = await sql<Usuario>(query, params);
      return result.rows;
    } catch (error) {
      console.error("[v0] Error obteniendo usuarios:", error);
      throw error;
    }
  }

  static async obtenerUsuarioPorId(id: string): Promise<Usuario | null> {
    try {
      const query = `
        SELECT id, email, nombre_completo, rol, departamento_id, telegram_chat_id, correo_google, activo, cedula, telefono
        FROM usuarios
        WHERE id = $1 AND activo = true
        LIMIT 1
      `;
      const result = await sql<Usuario>(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error("[v0] Error obteniendo usuario por ID:", error);
      throw error;
    }
  }

  static async obtenerUsuarioPorEmail(email: string): Promise<Usuario | null> {
    try {
      const query = `
        SELECT id, email, nombre_completo, rol, departamento_id, telegram_chat_id, correo_google, activo, cedula, telefono
        FROM usuarios
        WHERE email = $1 AND activo = true
        LIMIT 1
      `;
      const result = await sql<Usuario>(query, [email]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error("[v0] Error obteniendo usuario por email:", error);
      throw error;
    }
  }

  static async verificarPassword(
    userId: string,
    passwordActual: string
  ): Promise<boolean> {
    try {
      const query = `SELECT password_hash FROM usuarios WHERE id = $1 LIMIT 1`;
      const result = await sql<PasswordCheckResult>(query, [userId]);

      if (result.rows.length === 0) {
        return false;
      }

      const hash = result.rows[0].password_hash;
      return verifyPassword(passwordActual, hash);
    } catch (error) {
      console.error("[v0] Error verificando password:", error);
      return false;
    }
  }

  static async crearUsuario(
    email: string,
    password: string,
    nombre_completo: string,
    rol: string,
    departamento_id: string,
    cedula: string,
    telefono?: string
  ): Promise<Usuario> {
    try {
      const passwordHash = await hashPassword(password);

      const queryInsertUser = `
        INSERT INTO usuarios (email, password_hash, nombre_completo, rol, departamento_id, cedula, telefono, activo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        RETURNING *
      `;
      const result = await sql<Usuario>(queryInsertUser, [
        email,
        passwordHash,
        nombre_completo,
        rol,
        departamento_id,
        cedula,
        telefono || null,
      ]);

      const nuevoUsuario = result.rows[0];

      const queryInsertConfig = `
        INSERT INTO configuracion_notificaciones (usuario_id, telegram_habilitado, email_habilitado, calendario_habilitado, dias_anticipacion)
        VALUES ($1, true, true, true, 3)
        ON CONFLICT (usuario_id) DO NOTHING
      `;
      await sql(queryInsertConfig, [nuevoUsuario.id]);

      return nuevoUsuario;
    } catch (error) {
      console.error("[v0] Error creando usuario:", error);
      throw error;
    }
  }

  static async actualizarUsuario(
    id: string,
    datos: Partial<Usuario>,
    nuevaPassword?: string
  ): Promise<Usuario> {
    try {
      let passwordHash: string | undefined;
      if (nuevaPassword) {
        passwordHash = await hashPassword(nuevaPassword);
      }

      const campos: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (datos.nombre_completo) {
        campos.push(`nombre_completo = $${paramIndex++}`);
        params.push(datos.nombre_completo);
      }
      if (datos.email) {
        campos.push(`email = $${paramIndex++}`);
        params.push(datos.email);
      }
      if (datos.rol) {
        campos.push(`rol = $${paramIndex++}`);
        params.push(datos.rol);
      }
      if (datos.departamento_id) {
        campos.push(`departamento_id = $${paramIndex++}`);
        params.push(datos.departamento_id);
      }
      if (datos.cedula) {
        campos.push(`cedula = $${paramIndex++}`);
        params.push(datos.cedula);
      }
      if (datos.telefono) {
        campos.push(`telefono = $${paramIndex++}`);
        params.push(datos.telefono);
      }
      if (datos.telegram_chat_id !== undefined) {
        campos.push(`telegram_chat_id = $${paramIndex++}`);
        params.push(datos.telegram_chat_id || null);
      }

      if (passwordHash) {
        campos.push(`password_hash = $${paramIndex++}`);
        params.push(passwordHash);
      }

      if (campos.length === 0) {
        const usuario = await this.obtenerUsuarioPorId(id);
        if (!usuario) throw new Error("Usuario no encontrado");
        return usuario;
      }

      params.push(id);
      const query = `
        UPDATE usuarios
        SET ${campos.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await sql<Usuario>(query, params);
      return result.rows[0];
    } catch (error) {
      console.error("[v0] Error actualizando usuario:", error);
      throw error;
    }
  }

  static async obtenerUsuariosPorDepartamentoId(
    departamentoId: string
  ): Promise<Usuario[]> {
    try {
      const query = `
        SELECT id, email, nombre_completo, rol, departamento_id, cedula, telefono, telegram_chat_id
        FROM usuarios
        WHERE departamento_id = $1 AND activo = true
        ORDER BY nombre_completo ASC
      `;
      const result = await sql<Usuario>(query, [departamentoId]);
      return result.rows;
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
      const result = await sql<ConfiguracionNotificaciones>(query, params);
      return result.rows[0];
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
      const result = await sql<ConfiguracionNotificaciones>(query, [usuarioId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(
        "[v0] Error obteniendo configuración de notificaciones:",
        error
      );
      throw error;
    }
  }
}
