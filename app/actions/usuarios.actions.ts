"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { crearUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
// --- ¡IMPORTAMOS EL SERVICIO ACTUALIZADO! ---
import { UsuariosService } from "@/services/usuarios.service";

// --- ESQUEMA PARA CREAR ---
const schemaCrearUsuario = z.object({
  nombre_completo: z
    .string()
    .min(3, "El nombre es requerido")
    .regex(
      /^[a-zA-Z\sñÑáéíóúÁÉÍÓÚ]*$/,
      "El nombre solo debe contener letras y espacios"
    ),
  cedula: z
    .string()
    .min(6, "La cédula es requerida")
    .regex(/^[0-9]+$/, "La cédula solo debe contener números"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  rol: z
    .string()
    .refine((val) => val.length > 0, {
      message: "Debe seleccionar un rol",
    })
    .pipe(
      z.enum(["jefe_departamento", "miembro_departamento", "superusuario"])
    ),
  departamento_id: z
    .string()
    .min(1, "Debe seleccionar un departamento")
    .uuid("Formato de departamento inválido."),
  telefono: z.string().optional().or(z.literal("")),
});

// --- ¡NUEVO ESQUEMA PARA EDITAR! ---
// La contraseña es opcional y solo se valida si se escribe
const schemaEditarUsuario = schemaCrearUsuario.extend({
  password: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((pass) => pass === "" || !pass || pass.length >= 8, {
      message: "La nueva contraseña debe tener al menos 8 caracteres",
    }),
});

// Estado del formulario (sirve para ambos)
export type EstadoFormulario = {
  mensaje: string;
  errores?: {
    nombre_completo?: string[];
    cedula?: string[];
    email?: string[];
    password?: string[];
    rol?: string[];
    departamento_id?: string[];
    telefono?: string[];
  };
};

// (La función 'accionCrearUsuario' no cambia)
export async function accionCrearUsuario(
  estadoPrevio: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  // ... (código existente sin cambios)
}

// --- ¡NUEVA ACCIÓN PARA EDITAR USUARIO! ---

export async function accionEditarUsuario(
  userId: string, // ID del usuario a editar
  estadoPrevio: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  // 1. Validar los datos con el nuevo esquema
  const datosValidados = schemaEditarUsuario.safeParse({
    nombre_completo: formData.get("nombre_completo"),
    cedula: formData.get("cedula"),
    email: formData.get("email"),
    password: formData.get("password"),
    rol: formData.get("rol"),
    departamento_id: formData.get("departamento_id"),
    telefono: formData.get("telefono"),
  });

  // 2. Si la validación falla
  if (!datosValidados.success) {
    return {
      mensaje: "Error de validación. Revise los campos.",
      errores: datosValidados.error.flatten().fieldErrors,
    };
  }

  // 3. Preparar los datos para la actualización
  try {
    const { password, ...datosUsuario } = datosValidados.data;

    // Llamamos a la nueva función del servicio
    await UsuariosService.actualizarUsuario(
      userId,
      datosUsuario,
      password || undefined // Solo pasa la contraseña si no está vacía
    );
  } catch (error: any) {
    console.error(error);
    // Manejar errores de duplicados (email, cédula)
    if (error.code === "23505") {
      if (error.constraint === "usuarios_email_key") {
        return {
          mensaje: "Error al actualizar.",
          errores: { email: ["Este correo electrónico ya está en uso."] },
        };
      }
      if (
        error.constraint === "usuarios_cedula_key" ||
        (error.detail && error.detail.includes("(cedula)"))
      ) {
        return {
          mensaje: "Error al actualizar.",
          errores: { cedula: ["Esta cédula ya está registrada."] },
        };
      }
    }
    return {
      mensaje: "Error de base de datos. No se pudo actualizar el usuario.",
    };
  }

  // 4. Éxito
  revalidatePath("/dashboard/usuarios");
  redirect("/dashboard/usuarios");
}

// (La función 'accionEliminarUsuario' no cambia)
export async function accionEliminarUsuario(
  userId: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user || session.user.rol !== "superusuario") {
    return { success: false, message: "Acceso denegado." };
  }

  if (session.user.id === userId) {
    return { success: false, message: "No puedes eliminar tu propia cuenta." };
  }

  try {
    const query = `DELETE FROM usuarios WHERE id = $1`;
    await sql(query, [userId]);

    revalidatePath("/dashboard/usuarios");
    return { success: true, message: "Usuario eliminado exitosamente." };
  } catch (error: any) {
    console.error("Error al eliminar usuario:", error);
    return {
      success: false,
      message: "Error de base de datos. No se pudo eliminar el usuario.",
    };
  }
}
