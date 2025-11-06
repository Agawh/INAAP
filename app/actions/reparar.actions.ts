// /app/actions/reparar.actions.ts
"use server";

import { hashPassword } from "@/lib/auth"; //
import { sql } from "@/lib/db"; //

/**
 * Esta es una acción de reparación de emergencia.
 * Arregla el hash del 'admin@inatur.gob.ve' directamente.
 */
export async function repararHashAdmin() {
  try {
    const email = "admin@inatur.gob.ve";
    const nuevaPassword = "inatur123"; // La contraseña que SÍ funcionará

    // 1. Generar el hash nosotros mismos
    const nuevoHash = await hashPassword(nuevaPassword);

    // 2. Actualizar la BD (usando la sintaxis corregida)
    const query = `
      UPDATE usuarios 
      SET password_hash = $1 
      WHERE email = $2
    `;
    await sql(query, [nuevoHash, email]);

    const message = `REPARACIÓN EXITOSA: Hash para '${email}' actualizado. Ahora inicia sesión.`;
    console.log(message);
    return { success: true, message: message };
  } catch (error) {
    const message = "--- ERROR EN REPARACIÓN ---";
    console.error(message, error);
    return { success: false, message: "Error al reparar el hash." };
  }
}
