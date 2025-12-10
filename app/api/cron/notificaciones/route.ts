// /app/api/cron/notificaciones/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createTransport } from "nodemailer";

// Configuración de Nodemailer
const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const dynamic = "force-dynamic";

// --- FUNCION HELPER PARA PROCESAR CADA TIPO ---
async function procesarNotificacion(
  tipoReal: string,
  fechaBusqueda: string,
  asuntoPrefix: string,
  destinatarios: any[]
) {
  // 1. Buscar actividades
  const res = await sql(
    "SELECT * FROM actividades WHERE fecha_inicio = $1 AND estado != 'cancelada' AND estado != 'suspendido'",
    [fechaBusqueda]
  );
  const actividades = res.rows;

  if (actividades.length === 0)
    return { tipo: tipoReal, estado: "sin_actividades", cantidad: 0 };

  // 2. Enviar correos
  const emailPromises = actividades.map(async (actividad: any) => {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #0056b3;">${asuntoPrefix} ${actividad.titulo}</h2>
        <p><strong>Tipo:</strong> <span style="text-transform: capitalize;">${
          actividad.tipo
        }</span></p>
        <p><strong>Fecha:</strong> ${actividad.fecha_inicio}</p>
        <p><strong>Estado:</strong> ${actividad.estado}</p>
        <p><strong>Descripción:</strong><br/>${
          actividad.descripcion || "Sin descripción"
        }</p>
        <hr/>
        <p style="font-size: 12px; color: #666;">Sistema de Gestión INATUR Táchira - Notificación Automática</p>
      </div>
    `;

    const listaCorreos = destinatarios.map((u: any) => u.email).join(", ");

    try {
      await transporter.sendMail({
        from:
          process.env.SMTP_FROM || '"Sistema INATUR" <no-reply@inatur.gob.ve>',
        to: process.env.SMTP_USER,
        bcc: listaCorreos,
        subject: `${asuntoPrefix}${actividad.titulo}`,
        html: htmlContent,
      });
      return { id: actividad.id, status: "enviado" };
    } catch (error) {
      console.error(`Error enviando correo actividad ${actividad.id}:`, error);
      return { id: actividad.id, status: "error" };
    }
  });

  await Promise.all(emailPromises);
  return { tipo: tipoReal, estado: "procesado", cantidad: actividades.length };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const tipoParam = searchParams.get("tipo");

  const CRON_SECRET = process.env.CRON_SECRET || "INATUR_CRON_SECRET";

  // Validación laxa para pruebas manuales
  if (
    token !== CRON_SECRET &&
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Obtener Destinatarios (Una sola vez para optimizar)
    const resUsuarios = await sql(
      `SELECT u.email 
       FROM usuarios u
       JOIN configuracion_notificaciones c ON u.id = c.usuario_id
       WHERE c.email_habilitado = true AND u.activo = true`
    );
    const destinatarios = resUsuarios.rows;

    if (destinatarios.length === 0) {
      return NextResponse.json({ message: "No hay usuarios suscritos" });
    }

    // 2. Calcular Fechas (Hora Vzla)
    const hoy = new Date();
    const fechaHoy = hoy.toLocaleDateString("en-CA", {
      timeZone: "America/Caracas",
    });

    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);
    const fechaManana = manana.toLocaleDateString("en-CA", {
      timeZone: "America/Caracas",
    });

    const semana = new Date(hoy);
    semana.setDate(hoy.getDate() + 7);
    const fechaSemana = semana.toLocaleDateString("en-CA", {
      timeZone: "America/Caracas",
    });

    const resultados = [];

    // 3. Orquestador de Tareas
    // Si es "turno_manana", ejecutamos MISMO DÍA y SEMANA ANTES
    if (tipoParam === "turno_manana" || tipoParam === "mismo_dia") {
      resultados.push(
        await procesarNotificacion(
          "mismo_dia",
          fechaHoy,
          "🔔 HOY: ",
          destinatarios
        )
      );
    }

    if (tipoParam === "turno_manana" || tipoParam === "semana_antes") {
      resultados.push(
        await procesarNotificacion(
          "semana_antes",
          fechaSemana,
          "📅 PRÓXIMAMENTE (7 días): ",
          destinatarios
        )
      );
    }

    // Si es "turno_tarde", ejecutamos DÍA ANTES
    if (tipoParam === "turno_tarde" || tipoParam === "dia_antes") {
      resultados.push(
        await procesarNotificacion(
          "dia_antes",
          fechaManana,
          "⏰ MAÑANA: ",
          destinatarios
        )
      );
    }

    return NextResponse.json({
      success: true,
      ejecucion: tipoParam,
      resultados,
    });
  } catch (error: any) {
    console.error("Error en CRON:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
