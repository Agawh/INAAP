// /app/actions/usuarios.actions.ts
"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearUsuario } from "@/lib/auth";

// --- ¡CAMBIO AQUÍ! (Añadido 'cedula') ---
const schemaCrearUsuario = z.object({
  nombre_completo: z.string().min(3, "El nombre es requerido"),
  cedula: z.string().min(6, "La cédula es requerida"), // <-- ¡AÑADIDO!
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  rol: z.enum(["jefe_departamento", "miembro_departamento", "superusuario"]),
  departamento_id: z.string().uuid("Debe seleccionar un departamento"),
});

export type EstadoFormulario = {
  mensaje: string;
  errores?: {
    nombre_completo?: string[];
    cedula?: string[]; // <-- ¡AÑADIDO!
    email?: string[];
    password?: string[];
    rol?: string[];
    departamento_id?: string[];
  };
};

export async function accionCrearUsuario(
  estadoPrevio: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  // --- ¡CAMBIO AQUÍ! (Añadido 'cedula') ---
  const datosValidados = schemaCrearUsuario.safeParse({
    nombre_completo: formData.get("nombre_completo"),
    cedula: formData.get("cedula"), // <-- ¡AÑADIDO!
    email: formData.get("email"),
    password: formData.get("password"),
    rol: formData.get("rol"),
    departamento_id: formData.get("departamento_id"),
  });

  if (!datosValidados.success) {
    return {
      mensaje: "Error de validación. Revise los campos.",
      errores: datosValidados.error.flatten().fieldErrors,
    };
  }

  try {
    // --- ¡CAMBIO AQUÍ! (Pasamos 'cedula') ---
    const { email, password, nombre_completo, rol, departamento_id, cedula } =
      datosValidados.data;
    await crearUsuario(
      email,
      password,
      nombre_completo,
      rol,
      departamento_id,
      cedula
    ); // <-- ¡AÑADIDO!
  } catch (error: any) {
    console.error(error);
    if (error.code === "23505") {
      // Error de 'unique_violation' de PostgreSQL
      if (error.constraint === "usuarios_email_key") {
        return {
          mensaje: "Error al crear el usuario.",
          errores: { email: ["Este correo electrónico ya está en uso."] },
        };
      }
      // Asumimos que la restricción UNIQUE de la cédula se llama 'usuarios_cedula_key'
      // Si la llamaste diferente en la BD, este mensaje genérico funcionará
      if (error.detail.includes("(cedula)")) {
        return {
          mensaje: "Error al crear el usuario.",
          errores: { cedula: ["Esta cédula ya está registrada."] },
        };
      }
    }
    return { mensaje: "Error de base de datos. No se pudo crear el usuario." };
  }

  revalidatePath("/dashboard/usuarios");
  redirect("/dashboard/usuarios");
}
