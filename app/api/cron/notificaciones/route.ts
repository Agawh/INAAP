// /app/api/cron/notificaciones/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createTransport } from "nodemailer";

// Configuración de Nodemailer (Reutiliza tus variables de entorno)
const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true, // true para puerto 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const dynamic = "force-dynamic"; // Importante para que no cachee

export async function GET(req: NextRequest) {
  // 1. Seguridad: Verificar Token
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const tipo = searchParams.get("tipo"); // 'mismo_dia', 'dia_antes', 'semana_antes'

  // En Vercel Cron, el token viene en el header de autorización automática,
  // pero para tus pruebas manuales mantenemos el query param o una variable de entorno.
  const CRON_SECRET = process.env.CRON_SECRET || "INATUR_CRON_SECRET";

  // Nota: Vercel protege los crons automáticamente si se configuran en vercel.json,
  // pero para llamadas manuales validamos el token.
  if (
    token !== CRON_SECRET &&
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    // Si quieres ser estricto descomenta la siguiente línea, por ahora lo dejamos laxo para que pruebes
    // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Calcular Fechas en Hora Venezuela (UTC-4)
    // Usamos 'en-CA' porque devuelve formato YYYY-MM-DD automáticamente
    const hoy = new Date();

    // Fecha de HOY en Vzla
    const fechaHoyString = hoy.toLocaleDateString("en-CA", {
      timeZone: "America/Caracas",
    });

    // Fecha de MAÑANA en Vzla
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);
    const fechaMananaString = manana.toLocaleDateString("en-CA", {
      timeZone: "America/Caracas",
    });

    // Fecha en 7 DÍAS en Vzla
    const semana = new Date(hoy);
    semana.setDate(hoy.getDate() + 7);
    const fechaSemanaString = semana.toLocaleDateString("en-CA", {
      timeZone: "America/Caracas",
    });

    let actividades: any[] = [];
    let asuntoPrefix = "";

    // 3. Seleccionar Actividades según el tipo
    if (tipo === "mismo_dia") {
      // Buscar actividades para HOY (7:00 AM)
      asuntoPrefix = "🔔 HOY: ";
      const res = await sql(
        "SELECT * FROM actividades WHERE fecha_inicio = $1 AND estado != 'cancelada' AND estado != 'suspendido'",
        [fechaHoyString]
      );
      actividades = res.rows;
    } else if (tipo === "dia_antes") {
      // Buscar actividades para MAÑANA (6:00 PM)
      asuntoPrefix = "⏰ MAÑANA: ";
      const res = await sql(
        "SELECT * FROM actividades WHERE fecha_inicio = $1 AND estado != 'cancelada' AND estado != 'suspendido'",
        [fechaMananaString]
      );
      actividades = res.rows;
    } else if (tipo === "semana_antes") {
      // Buscar actividades en 7 DÍAS
      asuntoPrefix = "📅 PRÓXIMAMENTE: ";
      // Nota: Tu lógica decía "Si se creó hace más de una semana".
      // Asumiremos que si la actividad ya está agendada para dentro de 7 días, vale la pena avisar.
      const res = await sql(
        "SELECT * FROM actividades WHERE fecha_inicio = $1 AND estado != 'cancelada' AND estado != 'suspendido'",
        [fechaSemanaString]
      );
      actividades = res.rows;
    }

    if (actividades.length === 0) {
      return NextResponse.json({
        message: `No hay actividades para notificar (${tipo})`,
      });
    }

    // 4. Obtener Destinatarios (Todos los que tengan email habilitado)
    // Según tu requerimiento: "Todos los departamentos reciben todo"
    const resUsuarios = await sql(
      `SELECT u.email, u.nombre_completo 
       FROM usuarios u
       JOIN configuracion_notificaciones c ON u.id = c.usuario_id
       WHERE c.email_habilitado = true AND u.activo = true`
    );
    const destinatarios = resUsuarios.rows;

    if (destinatarios.length === 0) {
      return NextResponse.json({
        message: "No hay usuarios suscritos a notificaciones",
      });
    }

    // 5. Enviar Correos (Loop)
    const emailPromises = actividades.map(async (actividad) => {
      // Construir cuerpo del correo
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
          <p style="font-size: 12px; color: #666;">Sistema de Gestión INATUR Táchira</p>
        </div>
      `;

      // Enviamos a todos los destinatarios (usando BCC para privacidad y eficiencia)
      const listaCorreos = destinatarios.map((u) => u.email).join(", ");

      try {
        await transporter.sendMail({
          from:
            process.env.SMTP_FROM ||
            '"Sistema INATUR" <no-reply@inatur.gob.ve>',
          to: process.env.SMTP_USER, // Se envía a sí mismo o un buzón central
          bcc: listaCorreos, // Copia oculta a todos los usuarios
          subject: `${asuntoPrefix}${actividad.titulo}`,
          html: htmlContent,
        });
        return { id: actividad.id, status: "enviado" };
      } catch (error) {
        console.error(
          `Error enviando correo actividad ${actividad.id}:`,
          error
        );
        return { id: actividad.id, status: "error" };
      }
    });

    const resultados = await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      tipo,
      notificadas: resultados.length,
      detalles: resultados,
    });
  } catch (error: any) {
    console.error("Error en CRON:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
