// /lib/auth.ts
import bcrypt from "bcryptjs";
import { sql } from "./db";
import type { Usuario } from "@/types";
// ¡Importamos el servicio que acabamos de arreglar!
import { UsuariosService } from "@/services/usuarios.service";

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

// ESTAS FUNCIONES SE MOVIERON a services/usuarios.service.ts
// - crearUsuario
// - obtenerUsuarioPorId
// - obtenerUsuarioPorEmail
// (Las hemos borrado de aquí para evitar confusión)
