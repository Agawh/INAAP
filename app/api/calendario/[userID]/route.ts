// /app/api/calendario/[userID]/route.ts
import { NextRequest, NextResponse } from "next/server";
import ical, { ICalCalendarMethod } from "ical-generator";
import { ActividadesService } from "@/services/actividades.service";
import { UsuariosService } from "@/services/usuarios.service";

export async function GET(
  req: NextRequest,
  // CORRECCIÓN AQUÍ: 'userID' debe coincidir con el nombre de la carpeta [userID]
  { params }: { params: Promise<{ userID: string }> }
) {
  // CORRECCIÓN AQUÍ: Desestructuramos 'userID' en lugar de 'userId'
  const { userID } = await params;

  // 1. Validar que el usuario existe
  // Pasamos 'userID' al servicio
  const usuario = await UsuariosService.obtenerUsuarioPorId(userID);

  if (!usuario) {
    return new NextResponse("Usuario no encontrado", { status: 404 });
  }

  // 2. Obtener las actividades
  const actividades = await ActividadesService.obtenerParaCalendario();

  // 3. Configurar el calendario
  const calendar = ical({
    name: "Actividades INATUR",
    description: "Calendario oficial de actividades y efemérides",
    method: ICalCalendarMethod.PUBLISH,
    timezone: "America/Caracas",
  });

  // 4. Convertir actividades a eventos de calendario
  actividades.forEach((act) => {
    const fechaInicio = new Date(act.fecha_inicio);
    const fechaFin = new Date(act.fecha_inicio);
    fechaFin.setDate(fechaFin.getDate() + 1);

    calendar.createEvent({
      id: act.id,
      start: fechaInicio,
      end: fechaFin,
      allDay: true,
      summary: `[${act.tipo === "operativa" ? "OP" : "EF"}] ${act.titulo}`,
      description: act.descripcion || "Sin descripción.",
    });
  });

  // 5. Devolver el archivo .ics
  return new NextResponse(calendar.toString(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="calendario-inatur.ics"',
    },
  });
}
