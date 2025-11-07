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
  return bcrypt.compare(password, hash);
}

export async function obtenerUsuarioPorEmail(
  email: string
): Promise<Usuario | null> {
  try {
    const query = `
      SELECT id, email, nombre_completo, rol, departamento_id, telegram_chat_id, correo_google, activo, cedula
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
    // --- ¡CAMBIO AQUÍ! (Añadido 'cedula') ---
    const query = `
      SELECT id, email, nombre_completo, rol, departamento_id, telegram_chat_id, correo_google, activo, cedula
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
  departamento_id: string,
  cedula: string // <-- ¡AÑADIDO!
): Promise<Usuario> {
  try {
    const passwordHash = await hashPassword(password);

    // --- ¡CAMBIO AQUÍ! (Añadido 'cedula' y '$6') ---
    const queryInsertUser = `
      INSERT INTO usuarios (email, password_hash, nombre_completo, rol, departamento_id, cedula, activo)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING *
    `;
    const result = await sql(queryInsertUser, [
      email,
      passwordHash,
      nombre_completo,
      rol,
      departamento_id,
      cedula,
    ]);

    const nuevoUsuario = result.rows[0] as Usuario;

    // --- (Esto ya estaba corregido) ---
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
