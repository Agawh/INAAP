// /app/api/calendario/[userID]/route.ts
import { NextRequest, NextResponse } from "next/server";
import ical, { ICalCalendarMethod } from "ical-generator";
import { ActividadesService } from "@/services/actividades.service";
import { UsuariosService } from "@/services/usuarios.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userID: string }> }
) {
  const { userID } = await params;

  // 1. Validar usuario
  const usuario = await UsuariosService.obtenerUsuarioPorId(userID);
  if (!usuario) {
    return new NextResponse("Usuario no encontrado", { status: 404 });
  }

  // 2. Obtener actividades
  const actividades = await ActividadesService.obtenerParaCalendario();

  // 3. Configurar calendario
  const calendar = ical({
    name: "Actividades INATUR",
    description: "Calendario oficial de actividades y efemérides",
    method: ICalCalendarMethod.PUBLISH,
    timezone: "America/Caracas",
  });

  // 4. Convertir actividades (CON FIX DE FECHA)
  actividades.forEach((act) => {
    if (!act.fecha_inicio) return;

    // --- FIX: Parseo Manual de Texto ---
    // La DB devuelve string "YYYY-MM-DD". Lo partimos para crear la fecha local exacta.
    const fechaStr = String(act.fecha_inicio); // Aseguramos string
    const [anio, mes, dia] = fechaStr.split("-").map(Number);

    // Creamos la fecha usando el constructor local (Año, Mes-1, Día)
    // Esto crea 2025-12-10 00:00:00 en la hora del sistema, perfecto para 'allDay'
    const fechaInicio = new Date(anio, mes - 1, dia);

    // Para eventos de todo el día, el final debe ser el día siguiente
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + 1);

    calendar.createEvent({
      id: act.id,
      start: fechaInicio,
      end: fechaFin,
      allDay: true, // Esto es clave para que Google Calendar ignore horas específicas
      summary: `[${act.tipo === "operativa" ? "OP" : "EF"}] ${act.titulo}`,
      description: act.descripcion || "Sin descripción.",
      location: "INATUR Táchira",
    });
  });

  // 5. Devolver .ics
  return new NextResponse(calendar.toString(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="calendario-inatur.ics"',
    },
  });
}
