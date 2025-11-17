// /app/actions/usuarios.actions.ts
"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { UsuariosService } from "@/services/usuarios.service";
import { sql } from "@/lib/db";

// --- Schema CREAR ---
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
    .min(1, "Debe seleccionar un rol")
    .pipe(
      z.enum(["jefe_departamento", "miembro_departamento", "superusuario"])
    ),

  departamento_id: z
    .string()
    .min(1, "Debe seleccionar un departamento")
    .uuid("Formato de departamento inválido."),

  telefono: z.string().optional().or(z.literal("")),
});

// --- Schema EDITAR ---
const schemaEditarUsuario = schemaCrearUsuario.extend({
  password: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((pass) => pass === "" || !pass || pass.length >= 8, {
      message: "La nueva contraseña debe tener al menos 8 caracteres",
    }),
  // --- ¡NUEVO CAMPO! ---
  telegram_chat_id: z.string().optional().or(z.literal("")),
});

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
    telegram_chat_id?: string[];
  };
};

// --- ACCIÓN CREAR ---
export async function accionCrearUsuario(
  estadoPrevio: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const datosValidados = schemaCrearUsuario.safeParse({
    nombre_completo: formData.get("nombre_completo"),
    cedula: formData.get("cedula"),
    email: formData.get("email"),
    password: formData.get("password"),
    rol: formData.get("rol"),
    departamento_id: formData.get("departamento_id"),
    telefono: formData.get("telefono"),
  });

  if (!datosValidados.success) {
    return {
      mensaje: "Error de validación. Revise los campos.",
      errores: datosValidados.error.flatten().fieldErrors,
    };
  }

  try {
    const {
      email,
      password,
      nombre_completo,
      rol,
      departamento_id,
      cedula,
      telefono,
    } = datosValidados.data;

    await UsuariosService.crearUsuario(
      email,
      password,
      nombre_completo,
      rol,
      departamento_id,
      cedula,
      telefono || undefined
    );
  } catch (error: any) {
    console.error(error);
    if (error.code === "23505") {
      if (error.constraint === "usuarios_email_key") {
        return {
          mensaje: "Error al crear el usuario.",
          errores: { email: ["Este correo electrónico ya está en uso."] },
        };
      }
      if (
        error.constraint === "usuarios_cedula_key" ||
        (error.detail && error.detail.includes("(cedula)"))
      ) {
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

// --- ACCIÓN EDITAR ---
export async function accionEditarUsuario(
  userId: string,
  estadoPrevio: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const datosValidados = schemaEditarUsuario.safeParse({
    nombre_completo: formData.get("nombre_completo"),
    cedula: formData.get("cedula"),
    email: formData.get("email"),
    password: formData.get("password"),
    rol: formData.get("rol"),
    departamento_id: formData.get("departamento_id"),
    telefono: formData.get("telefono"),
    // --- ¡NUEVO CAMPO! ---
    telegram_chat_id: formData.get("telegram_chat_id"),
  });

  if (!datosValidados.success) {
    return {
      mensaje: "Error de validación. Revise los campos.",
      errores: datosValidados.error.flatten().fieldErrors,
    };
  }

  try {
    const { password, telegram_chat_id, ...datosUsuario } = datosValidados.data;

    const datosParaActualizar = {
      ...datosUsuario,
      telegram_chat_id: telegram_chat_id || undefined,
    };

    await UsuariosService.actualizarUsuario(
      userId,
      datosParaActualizar,
      password || undefined
    );
  } catch (error: any) {
    console.error(error);
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

  revalidatePath("/dashboard/usuarios");
  redirect("/dashboard/usuarios");
}

// --- ACCIÓN ELIMINAR ---
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
