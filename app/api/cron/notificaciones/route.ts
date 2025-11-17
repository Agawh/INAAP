// /app/api/cron/notificaciones/route.ts
import { NextRequest, NextResponse } from "next/server";
import { NotificacionesService } from "@/services/notificaciones.service";

// Forzar que esta ruta sea dinámica (no estática)
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1. Seguridad simple: Verificar un token en la URL
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const tipo = searchParams.get("tipo");

  if (token !== "INATUR_CRON_SECRET") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Validamos que el tipo sea uno de los permitidos
  // Nota: TypeScript se quejará si no hacemos un cast, pero para la API está bien así por ahora
  if (
    tipo !== "semana_antes" &&
    tipo !== "noche_anterior" &&
    tipo !== "mismo_dia"
  ) {
    return NextResponse.json(
      { error: "Tipo de notificación inválido" },
      { status: 400 }
    );
  }

  try {
    // 2. Ejecutar el servicio
    // @ts-ignore (Ignoramos error de tipado estricto aquí para simplificar la llamada dinámica)
    const resultado = await NotificacionesService.procesarNotificaciones(tipo);

    return NextResponse.json({
      success: true,
      mensaje: `Proceso ${tipo} finalizado`,
      datos: resultado,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
