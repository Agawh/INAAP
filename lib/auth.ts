// /lib/auth.ts
import bcrypt from "bcryptjs";
import { sql } from "./db";
import type { Usuario } from "@/types";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // Versión limpia sin logs
  return bcrypt.compare(password, hash);
}

export async function obtenerUsuarioPorEmail(
  email: string
): Promise<Usuario | null> {
  try {
    // ---- Sintaxis SQL corregida ----
    const query = `
      SELECT id, email, nombre_completo, rol, departamento_id, telegram_chat_id, correo_google, activo
      FROM usuarios
      WHERE email = $1 AND activo = true
      LIMIT 1
    `;
    const result = await sql(query, [email]);
    return result.rows.length > 0 ? (result.rows[0] as Usuario) : null;
  } catch (error) {
    console.error("[v0] Error obteniendo usuario por email:", error);
    throw error;
  }
}

export async function obtenerUsuarioPorId(id: string): Promise<Usuario | null> {
  try {
    // ---- Sintaxis SQL corregida ----
    const query = `
      SELECT id, email, nombre_completo, rol, departamento_id, telegram_chat_id, correo_google, activo
      FROM usuarios
      WHERE id = $1 AND activo = true
      LIMIT 1
    `;
    const result = await sql(query, [id]);
    return result.rows.length > 0 ? (result.rows[0] as Usuario) : null;
  } catch (error) {
    console.error("[v0] Error obteniendo usuario por ID:", error);
    throw error;
  }
}

export async function crearUsuario(
  email: string,
  password: string,
  nombre_completo: string,
  rol: string,
  departamento_id: string
): Promise<Usuario> {
  try {
    const passwordHash = await hashPassword(password);

    // ---- Sintaxis SQL corregida ----
    const queryInsertUser = `
      INSERT INTO usuarios (email, password_hash, nombre_completo, rol, departamento_id, activo)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, email, nombre_completo, rol, departamento_id, telegram_chat_id, correo_google, activo
    `;
    const result = await sql(queryInsertUser, [
      email,
      passwordHash,
      nombre_completo,
      rol,
      departamento_id,
    ]);

    const nuevoUsuario = result.rows[0] as Usuario;

    // ---- Sintaxis SQL corregida ----
    const queryInsertConfig = `
      INSERT INTO configuracion_notificaciones (usuario_id, telegram_habilitado, email_habilitado, calendario_habilitado, dias_anticipacion)
      VALUES ($1, true, true, true, 3)
    `;
    await sql(queryInsertConfig, [nuevoUsuario.id]);

    return nuevoUsuario;
  } catch (error) {
    console.error("[v0] Error creando usuario:", error);
    throw error;
  }
}
