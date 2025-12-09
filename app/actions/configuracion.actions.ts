// /app/actions/configuracion.actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { UsuariosService } from "@/services/usuarios.service";

// Estado del formulario
export type EstadoFormularioPerfil = {
  mensaje: string;
  tipo: "exito" | "error";
  errores?: {
    password_actual?: string[];
    password_nueva?: string[];
  };
  resetPasswordFields?: boolean;
};

// --- Esquema para Notificaciones ---
// El checkbox envía "on" si está marcado, o nada si no.
// Zod espera transformar eso a boolean.
const schemaNotificaciones = z.object({
  email_habilitado: z
    .string()
    .optional()
    .transform((val) => val === "on"),
  telegram_habilitado: z
    .string()
    .optional()
    .transform((val) => val === "on"),
});

// --- Esquema para Contraseña ---
const schemaPassword = z.object({
  password_actual: z.string().min(1, "Debe ingresar su contraseña actual."),
  password_nueva: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
});

/**
 * Acción para actualizar la CONFIGURACIÓN DE NOTIFICACIONES
 */
export async function accionActualizarNotificaciones(
  estadoPrevio: EstadoFormularioPerfil,
  formData: FormData
): Promise<EstadoFormularioPerfil> {
  const session = await auth();
  if (!session?.user?.id) {
    return { mensaje: "Acceso denegado.", tipo: "error" };
  }

  // Parseamos los datos (los checkbox no enviados son undefined -> false)
  const datos = {
    email_habilitado: formData.get("email_habilitado"),
    telegram_habilitado: formData.get("telegram_habilitado"),
  };

  const validacion = schemaNotificaciones.safeParse(datos);

  if (!validacion.success) {
    return { mensaje: "Datos inválidos.", tipo: "error" };
  }

  try {
    await UsuariosService.actualizarConfiguracionNotificaciones(
      session.user.id,
      {
        email_habilitado: validacion.data.email_habilitado,
        telegram_habilitado: validacion.data.telegram_habilitado,
      }
    );

    revalidatePath("/dashboard/perfil");
    return {
      mensaje: "Preferencias guardadas correctamente.",
      tipo: "exito",
    };
  } catch (error) {
    console.error("[ACCION_NOTIFICACIONES]", error);
    return { mensaje: "Error al guardar preferencias.", tipo: "error" };
  }
}

/**
 * Acción para actualizar la CONTRASEÑA
 */
export async function accionActualizarPassword(
  estadoPrevio: EstadoFormularioPerfil,
  formData: FormData
): Promise<EstadoFormularioPerfil> {
  const session = await auth();
  if (!session?.user?.id) {
    return { mensaje: "Acceso denegado.", tipo: "error" };
  }
  const usuarioId = session.user.id;

  const datosValidados = schemaPassword.safeParse({
    password_actual: formData.get("password_actual"),
    password_nueva: formData.get("password_nueva"),
  });

  if (!datosValidados.success) {
    return {
      mensaje: "Error de validación.",
      tipo: "error",
      errores: datosValidados.error.flatten().fieldErrors,
    };
  }

  const { password_actual, password_nueva } = datosValidados.data;

  try {
    const passwordValida = await UsuariosService.verificarPassword(
      usuarioId,
      password_actual
    );

    if (!passwordValida) {
      return {
        mensaje: "Error al cambiar contraseña.",
        tipo: "error",
        errores: {
          password_actual: ["La contraseña actual es incorrecta."],
        },
      };
    }

    await UsuariosService.actualizarUsuario(usuarioId, {}, password_nueva);

    revalidatePath("/dashboard/perfil");
    return {
      mensaje: "Contraseña actualizada exitosamente.",
      tipo: "exito",
      resetPasswordFields: true,
    };
  } catch (error) {
    console.error("[ACCION_PASSWORD]", error);
    return { mensaje: "Error de base de datos.", tipo: "error" };
  }
}
