// /app/api/calendario/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import ical, { ICalCalendarMethod } from "ical-generator";
import { ActividadesService } from "@/services/actividades.service";
import { UsuariosService } from "@/services/usuarios.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  // 1. Validar que el usuario existe (seguridad básica)
  const usuario = await UsuariosService.obtenerUsuarioPorId(userId);
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
    timezone: "America/Caracas", // Ajusta esto a tu zona horaria real
  });

  // 4. Convertir actividades a eventos de calendario
  actividades.forEach((act) => {
    // Las actividades son de "todo el día"
    const fechaInicio = new Date(act.fecha_inicio);
    // iCal requiere que la fecha de fin sea el día siguiente para eventos de todo el día
    const fechaFin = new Date(act.fecha_inicio);
    fechaFin.setDate(fechaFin.getDate() + 1);

    calendar.createEvent({
      id: act.id, // El ID único evita duplicados si la actividad se actualiza
      start: fechaInicio,
      end: fechaFin,
      allDay: true,
      summary: `[${act.tipo === "operativa" ? "OP" : "EF"}] ${act.titulo}`,
      description: act.descripcion || "Sin descripción.",
      // url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/actividades/${act.id}`, // Opcional: link al sistema
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
