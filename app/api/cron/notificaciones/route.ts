// /app/api/cron/notificaciones/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createTransport } from "nodemailer";

export const dynamic = "force-dynamic";

// 1. Configuración de Email
const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 2. Helper para enviar a Telegram
async function enviarTelegram(chatId: string, mensaje: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensaje,
        parse_mode: "HTML", // Permite negritas y emojis
      }),
    });
  } catch (error) {
    console.error(`Error enviando Telegram a ${chatId}:`, error);
  }
}

// 3. Procesador principal
async function procesarNotificacion(
  tipoReal: string,
  fechaBusqueda: string,
  asuntoPrefix: string,
  destinatarios: any[]
) {
  // Buscar actividades para la fecha
  const res = await sql(
    "SELECT * FROM actividades WHERE fecha_inicio = $1 AND estado != 'cancelada' AND estado != 'suspendido'",
    [fechaBusqueda]
  );
  const actividades = res.rows;

  if (actividades.length === 0)
    return { tipo: tipoReal, estado: "sin_actividades", cantidad: 0 };

  // Iterar sobre cada actividad encontrada
  const promesasEnvio = actividades.map(async (actividad: any) => {
    // --- Preparar Mensajes ---
    // A. Cuerpo HTML para Correo
    const htmlEmail = `
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

    // B. Texto para Telegram (con formato HTML simple)
    const textoTelegram = `
<b>${asuntoPrefix} ${actividad.titulo}</b>
📅 <b>Fecha:</b> ${actividad.fecha_inicio}
XR <b>Tipo:</b> ${actividad.tipo}
ℹ️ <b>Estado:</b> ${actividad.estado}

${actividad.descripcion || "Sin descripción."}
    `.trim();

    // --- Enviar a cada usuario según su configuración ---
    const enviosUsuario = destinatarios.map(async (usuario: any) => {
      // 1. Enviar Email si está habilitado
      if (usuario.email_habilitado && usuario.email) {
        try {
          await transporter.sendMail({
            from:
              process.env.SMTP_FROM ||
              '"Sistema INATUR" <no-reply@inatur.gob.ve>',
            to: usuario.email,
            subject: `${asuntoPrefix}${actividad.titulo}`,
            html: htmlEmail,
          });
        } catch (e) {
          console.error("Fallo email", e);
        }
      }

      // 2. Enviar Telegram si está habilitado y tiene Chat ID
      if (usuario.telegram_habilitado && usuario.telegram_chat_id) {
        await enviarTelegram(usuario.telegram_chat_id, textoTelegram);
      }
    });

    await Promise.all(enviosUsuario);
    return { id: actividad.id, status: "procesado" };
  });

  await Promise.all(promesasEnvio);
  return { tipo: tipoReal, estado: "procesado", cantidad: actividades.length };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const tipoParam = searchParams.get("tipo");

  // Validación básica
  const CRON_SECRET = process.env.CRON_SECRET || "INATUR_CRON_SECRET";
  if (
    token !== CRON_SECRET &&
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Obtener Usuarios y sus preferencias (Email Y Telegram)
    const resUsuarios = await sql(
      `SELECT 
          u.email, 
          u.telegram_chat_id,
          c.email_habilitado, 
          c.telegram_habilitado
       FROM usuarios u
       JOIN configuracion_notificaciones c ON u.id = c.usuario_id
       WHERE u.activo = true AND (c.email_habilitado = true OR c.telegram_habilitado = true)`
    );
    const destinatarios = resUsuarios.rows;

    if (destinatarios.length === 0) {
      return NextResponse.json({ message: "No hay usuarios para notificar" });
    }

    // 2. Calcular Fechas (Hora Vzla - Strings exactos)
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

    // 3. Ejecución
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
          "📅 PRÓXIMAMENTE: ",
          destinatarios
        )
      );
    }
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
    console.error("Error CRON:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
