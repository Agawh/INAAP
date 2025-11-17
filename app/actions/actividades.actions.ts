// /app/actions/actividades.actions.ts
"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ActividadesService } from "@/services/actividades.service";
import { sql } from "@/lib/db";
import type {
  TipoActividad,
  CrearActividadDTO,
  EstadoActividad,
  ActualizarActividadDTO,
  Rol,
} from "@/types";
import { UsuariosService } from "@/services/usuarios.service";

export type EstadoFormularioActividad = {
  mensaje: string;
  errores?: Record<string, string[] | undefined>;
};

// --- ¡CAMBIO! (schemaEditarActividad) ---
const schemaEditarActividad = z.object({
  titulo: z.string().min(3, "El título debe tener al menos 3 caracteres"),

  descripcion: z.string().optional(),

  // --- ¡BUG 1 CORREGIDO! ---
  // Ya no usamos .pipe(z.coerce.date())
  // Solo validamos que sea un string con el formato YYYY-MM-DD
  fecha_inicio: z
    .string()
    .min(10, "La fecha de inicio es requerida.")
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Formato de fecha inválido (debe ser YYYY-MM-DD)"
    ),

  tipo: z
    .string()
    .min(1, "Debe seleccionar un tipo de actividad.")
    .pipe(z.enum(["operativa", "efemeride"])),

  departamento_ids: z
    .array(z.string().uuid("ID de departamento inválido."))
    .min(1, "Debe seleccionar al menos un departamento."),
});

// (accionCrearActividad - ahora usa el nuevo schema, no hay más cambios)
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

  const rolUsuario = session.user.rol as Rol;

  if (rolUsuario === "jefe_departamento") {
    const idDeptoUsuario = (
      await UsuariosService.obtenerUsuarioPorId(idUsuarioLogueado)
    )?.departamento_id;
    const idsEnviados = formData.getAll("departamento_ids");

    if (
      !idDeptoUsuario ||
      idsEnviados.length !== 1 ||
      idsEnviados[0] !== idDeptoUsuario
    ) {
      return {
        mensaje:
          "Error de permisos. Solo puede crear actividades para su propio departamento.",
        errores: {},
      };
    }
  } else if (rolUsuario !== "superusuario") {
    return {
      mensaje: "Acceso denegado. No tiene permisos para crear actividades.",
      errores: {},
    };
  }

  // Ahora usa el schema corregido (fecha como string)
  const datosValidados = schemaEditarActividad.safeParse({
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
  const {
    titulo,
    descripcion,
    fecha_inicio, // <-- Ahora es un string
    tipo,
    departamento_ids,
  } = datosValidados.data;
  const dto: CrearActividadDTO = {
    titulo,
    descripcion: descripcion || undefined,
    fecha_inicio, // <-- Se pasa como string
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

// (accionEliminarActividad y accionActualizarEstadoActividad sin cambios)
export async function accionEliminarActividad(
  actividadId: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "Acceso denegado." };
  }

  if (session.user.rol === "jefe_departamento") {
    const usuario = await UsuariosService.obtenerUsuarioPorId(session.user.id);
    if (!usuario?.departamento_id) {
      return {
        success: false,
        message: "Acceso denegado. Usuario sin departamento.",
      };
    }
    const tienePermiso = await ActividadesService.verificarPertenencia(
      actividadId,
      usuario.departamento_id
    );
    if (!tienePermiso) {
      return {
        success: false,
        message:
          "Acceso denegado. No puede eliminar actividades de otros departamentos.",
      };
    }
  } else if (session.user.rol !== "superusuario") {
    return {
      success: false,
      message: "Acceso denegado. Permisos insuficientes.",
    };
  }

  try {
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

const schemaActualizarEstado = z.object({
  actividadId: z.string().uuid(),
  nuevoEstado: z.enum(["pendiente", "en_progreso", "completada", "cancelada"]),
});

export async function accionActualizarEstadoActividad(
  actividadId: string,
  nuevoEstado: EstadoActividad
): Promise<{ success: boolean; message: string; nuevoEstado?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Acceso denegado." };
  }
  const usuarioId = session.user.id;

  if (session.user.rol === "jefe_departamento") {
    const usuario = await UsuariosService.obtenerUsuarioPorId(session.user.id);
    if (!usuario?.departamento_id) {
      return {
        success: false,
        message: "Acceso denegado. Usuario sin departamento.",
      };
    }
    const tienePermiso = await ActividadesService.verificarPertenencia(
      actividadId,
      usuario.departamento_id
    );
    if (!tienePermiso) {
      return {
        success: false,
        message: "Acceso denegado. No puede modificar esta actividad.",
      };
    }
  } else if (session.user.rol !== "superusuario") {
    return {
      success: false,
      message: "Acceso denegado. Permisos insuficientes.",
    };
  }

  const validation = schemaActualizarEstado.safeParse({
    actividadId,
    nuevoEstado,
  });
  if (!validation.success) {
    return { success: false, message: "Datos inválidos para actualizar." };
  }
  try {
    await ActividadesService.actualizar(
      actividadId,
      { estado: nuevoEstado },
      usuarioId
    );
    revalidatePath("/dashboard/actividades");
    return {
      success: true,
      message: `Estado actualizado.`,
      nuevoEstado: nuevoEstado,
    };
  } catch (error: any) {
    console.error("Error al actualizar estado:", error);
    return {
      success: false,
      message: "Error de base de datos. No se pudo actualizar el estado.",
    };
  }
}

// --- ¡CAMBIO! (accionEditarActividad) ---
export async function accionEditarActividad(
  actividadId: string,
  estadoPrevio: EstadoFormularioActividad,
  formData: FormData
): Promise<EstadoFormularioActividad> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      mensaje: "Error de autenticación. No se pudo actualizar.",
      errores: {},
    };
  }
  const usuarioId = session.user.id;
  const rolUsuario = session.user.rol as Rol;

  if (rolUsuario === "jefe_departamento") {
    const usuario = await UsuariosService.obtenerUsuarioPorId(session.user.id);
    if (!usuario?.departamento_id) {
      return {
        mensaje: "Acceso denegado. Usuario sin departamento.",
        errores: {},
      };
    }
    const tienePermiso = await ActividadesService.verificarPertenencia(
      actividadId,
      usuario.departamento_id
    );
    if (!tienePermiso) {
      return {
        mensaje: "Acceso denegado. No puede editar esta actividad.",
        errores: {},
      };
    }
    const idsEnviados = formData.getAll("departamento_ids");
    if (
      idsEnviados.length !== 1 ||
      idsEnviados[0] !== usuario.departamento_id
    ) {
      return {
        mensaje:
          "Error de permisos. Solo puede asignar actividades a su propio departamento.",
        errores: {},
      };
    }
  } else if (rolUsuario !== "superusuario") {
    return { mensaje: "Acceso denegado. Permisos insuficientes.", errores: {} };
  }

  // Se usa el schema corregido (fecha como string)
  const datosValidados = schemaEditarActividad.safeParse({
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
  const {
    titulo,
    descripcion,
    fecha_inicio, // <-- Sigue siendo un string
    tipo,
    departamento_ids,
  } = datosValidados.data;

  // --- ¡BUG 2 CORREGIDO! ---
  const dto: ActualizarActividadDTO = {
    titulo,
    descripcion: descripcion || undefined,
    tipo: tipo as TipoActividad,
    departamento_ids,
    fecha_inicio: fecha_inicio, // <-- AÑADIDO (¡El bug estaba aquí!)
  };

  try {
    await ActividadesService.actualizar(actividadId, dto, usuarioId);
  } catch (error: any) {
    console.error("[ACCION_EDITAR_ACTIVIDAD]", error);
    return {
      mensaje: "Error de base de datos. No se pudo actualizar la actividad.",
    };
  }
  revalidatePath("/dashboard/actividades");
  redirect("/dashboard/actividades");
}
