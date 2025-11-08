// /app/actions/actividades.actions.ts
"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ActividadesService } from "@/services/actividades.service";
import { sql } from "@/lib/db"; // <-- ¡IMPORTANTE! Importar 'sql'
import type { TipoActividad, Prioridad, CrearActividadDTO } from "@/types";

export type EstadoFormularioActividad = {
  mensaje: string;
  errores?: Record<string, string[] | undefined>;
};

// (El schemaCrearActividad y accionCrearActividad no cambian)
const schemaCrearActividad = z.object({
  titulo: z.string().min(3, "El título debe tener al menos 3 caracteres"),

  descripcion: z.string().optional(),

  fecha_inicio: z
    .string()
    .min(1, "La fecha de inicio es requerida.")
    .pipe(z.coerce.date()),

  tipo: z
    .string()
    .min(1, "Debe seleccionar un tipo de actividad.")
    .pipe(z.enum(["operativa", "efemeride"])),

  departamento_ids: z
    .array(z.string().uuid("ID de departamento inválido."))
    .min(1, "Debe seleccionar al menos un departamento."),
});

export async function accionCrearActividad(
  estadoPrevio: EstadoFormularioActividad,
  formData: FormData
): Promise<EstadoFormularioActividad> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      mensaje: "Error de autenticación. No se pudo crear la actividad.",
      errores: {},
    };
  }
  const idUsuarioLogueado = session.user.id;

  const datosValidados = schemaCrearActividad.safeParse({
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    fecha_inicio: formData.get("fecha_inicio"),
    tipo: formData.get("tipo"),
    departamento_ids: formData.getAll("departamento_ids"),
  });

  if (!datosValidados.success) {
    return {
      mensaje: "Error de validación. Revise los campos.",
      errores: datosValidados.error.flatten().fieldErrors,
    };
  }

  const { titulo, descripcion, fecha_inicio, tipo, departamento_ids } =
    datosValidados.data;

  const dto: CrearActividadDTO = {
    titulo,
    descripcion: descripcion || undefined,
    fecha_inicio,
    tipo: tipo as TipoActividad,
    departamento_ids,
  };

  try {
    await ActividadesService.crear(dto, idUsuarioLogueado);
  } catch (error: any) {
    console.error("[ACCION_CREAR_ACTIVIDAD]", error);
    return {
      mensaje: "Error de base de datos. No se pudo crear la actividad.",
      errores: {},
    };
  }

  revalidatePath("/dashboard/actividades");
  redirect("/dashboard/actividades");
}

// --- ¡NUEVA ACCIÓN AÑADIDA! ---
export async function accionEliminarActividad(
  actividadId: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "Acceso denegado." };
  }

  // (Opcional: podrías añadir lógica de roles aquí,
  // ej. solo el creador o un superusuario puede borrar)

  try {
    // Usamos 'sql' directamente para la eliminación
    const query = `DELETE FROM actividades WHERE id = $1`;
    await sql(query, [actividadId]);

    revalidatePath("/dashboard/actividades");
    return { success: true, message: "Actividad eliminada exitosamente." };
  } catch (error: any) {
    console.error("Error al eliminar actividad:", error);
    return {
      success: false,
      message: "Error de base de datos. No se pudo eliminar la actividad.",
    };
  }
}
