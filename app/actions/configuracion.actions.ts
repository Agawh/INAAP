// /app/actions/configuracion.actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { UsuariosService } from "@/services/usuarios.service";
// 'ConfiguracionNotificaciones' ya no es necesario aquí

// Estado del formulario simplificado
export type EstadoFormularioPerfil = {
  mensaje: string;
  tipo: "exito" | "error";
  errores?: {
    // Ya no hay errores de notificación
    password_actual?: string[];
    password_nueva?: string[];
  };
  // Para limpiar el formulario de contraseña en caso de éxito
  resetPasswordFields?: boolean;
};

// --- schemaNotificaciones eliminado ---
// --- accionActualizarNotificaciones eliminado ---

// --- Esquema para la sección de Contraseña (sin cambios) ---
const schemaPassword = z.object({
  password_actual: z.string().min(1, "Debe ingresar su contraseña actual."),
  password_nueva: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
});

/**
 * Acción para actualizar la CONTRASEÑA del usuario logueado
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
    // 1. Verificar la contraseña actual (usando la función real del servicio)
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

    // 2. Si es válida, actualizar con la nueva contraseña
    await UsuariosService.actualizarUsuario(
      usuarioId,
      {}, // No actualizamos otros datos del usuario
      password_nueva
    );

    revalidatePath("/dashboard/perfil");
    return {
      mensaje: "Contraseña actualizada exitosamente.",
      tipo: "exito",
      resetPasswordFields: true, // <- Enviamos señal para limpiar inputs
    };
  } catch (error) {
    console.error("[ACCION_PASSWORD]", error);
    return { mensaje: "Error de base de datos.", tipo: "error" };
  }
}
