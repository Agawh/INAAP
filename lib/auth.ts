import bcrypt from "bcryptjs"
import { sql } from "./db"
import type { Usuario } from "@/types"

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function obtenerUsuarioPorEmail(email: string): Promise<Usuario | null> {
  try {
    const result = await sql`
      SELECT id, email, nombre_completo, rol, departamento_id, telegram_chat_id, correo_google, activo
      FROM usuarios
      WHERE email = ${email} AND activo = true
      LIMIT 1
    `
    return result.length > 0 ? (result[0] as Usuario) : null
  } catch (error) {
    console.error("[v0] Error obteniendo usuario por email:", error)
    throw error
  }
}

export async function obtenerUsuarioPorId(id: string): Promise<Usuario | null> {
  try {
    const result = await sql`
      SELECT id, email, nombre_completo, rol, departamento_id, telegram_chat_id, correo_google, activo
      FROM usuarios
      WHERE id = ${id} AND activo = true
      LIMIT 1
    `
    return result.length > 0 ? (result[0] as Usuario) : null
  } catch (error) {
    console.error("[v0] Error obteniendo usuario por ID:", error)
    throw error
  }
}

export async function crearUsuario(
  email: string,
  password: string,
  nombre_completo: string,
  rol: string,
  departamento_id: string,
): Promise<Usuario> {
  try {
    const passwordHash = await hashPassword(password)

    const result = await sql`
      INSERT INTO usuarios (email, password_hash, nombre_completo, rol, departamento_id, activo)
      VALUES (${email}, ${passwordHash}, ${nombre_completo}, ${rol}, ${departamento_id}, true)
      RETURNING id, email, nombre_completo, rol, departamento_id, telegram_chat_id, correo_google, activo
    `

    const nuevoUsuario = result[0] as Usuario

    // Crear configuración de notificaciones por defecto
    await sql`
      INSERT INTO configuracion_notificaciones (usuario_id, telegram_habilitado, email_habilitado, calendario_habilitado, dias_anticipacion)
      VALUES (${nuevoUsuario.id}, true, true, true, 3)
    `

    return nuevoUsuario
  } catch (error) {
    console.error("[v0] Error creando usuario:", error)
    throw error
  }
}
