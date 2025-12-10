// /app/api/cron/notificaciones/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createTransport } from "nodemailer";

export const dynamic = "force-dynamic";

// URL BASE de tu proyecto en producción (para los enlaces)
const BASE_URL = "https://inaapuf.vercel.app";

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

// --- HELPER: Formatear fecha de YYYY-MM-DD a DD/MM/YYYY ---
function formatearFechaLatina(fechaStr: string) {
  if (!fechaStr) return "Fecha no definida";
  // Asumimos que viene como YYYY-MM-DD (gracias al fix de db.ts)
  const partes = fechaStr.split("-"); // [2025, 12, 10]
  if (partes.length !== 3) return fechaStr;
  return `${partes[2]}/${partes[1]}/${partes[0]}`; // 10/12/2025
}

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
        parse_mode: "HTML",
        disable_web_page_preview: true,
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
  tituloAlerta: string,
  destinatarios: any[]
) {
  const res = await sql(
    "SELECT * FROM actividades WHERE fecha_inicio = $1 AND estado != 'cancelada' AND estado != 'suspendido'",
    [fechaBusqueda]
  );
  const actividades = res.rows;

  if (actividades.length === 0)
    return { tipo: tipoReal, estado: "sin_actividades", cantidad: 0 };

  const promesasEnvio = actividades.map(async (actividad: any) => {
    // Preparar datos formateados
    const fechaBonita = formatearFechaLatina(actividad.fecha_inicio);
    const linkActividad = `${BASE_URL}/dashboard/actividades/${actividad.id}`;
    const tipoCapitalizado =
      actividad.tipo.charAt(0).toUpperCase() + actividad.tipo.slice(1);

    // --- A. Diseño HTML para Correo (Mejorado) ---
    const htmlEmail = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0056b3; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">${tituloAlerta}</h2>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <h3 style="color: #333; margin-top: 0;">${actividad.titulo}</h3>
          
          <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">📅 <strong>Fecha:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333; text-align: right;">${fechaBonita}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">🏷 <strong>Tipo:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333; text-align: right;">${tipoCapitalizado}</td>
            </tr>
          </table>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <strong style="color: #555; display: block; margin-bottom: 5px;">Descripción:</strong>
            <p style="margin: 0; color: #333; line-height: 1.5;">${
              actividad.descripcion || "Sin descripción detallada."
            }</p>
          </div>

          <div style="text-align: center;">
            <a href="${linkActividad}" style="background-color: #0056b3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Ver Detalles en el Sistema</a>
          </div>
        </div>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; color: #888; font-size: 12px;">
          Sistema de Gestión INATUR Táchira<br/>
          Este es un mensaje automático, por favor no responder.
        </div>
      </div>
    `;

    // --- B. Texto para Telegram (Mejorado) ---
    const textoTelegram = `
<b>${tituloAlerta}</b>

📌 <b>${actividad.titulo}</b>

📅 <b>Fecha:</b> ${fechaBonita}
🏷 <b>Tipo:</b> ${tipoCapitalizado}

📝 <b>Descripción:</b>
<i>${actividad.descripcion || "Sin descripción."}</i>

🔗 <a href="${linkActividad}">Ver actividad en el sistema</a>
    `.trim();

    // --- Enviar ---
    const enviosUsuario = destinatarios.map(async (usuario: any) => {
      // 1. Email
      if (usuario.email_habilitado && usuario.email) {
        try {
          await transporter.sendMail({
            from:
              process.env.SMTP_FROM ||
              '"Sistema INATUR" <no-reply@inatur.gob.ve>',
            to: usuario.email,
            subject: `${tituloAlerta} ${actividad.titulo}`,
            html: htmlEmail,
          });
        } catch (e) {
          console.error("Fallo email", e);
        }
      }

      // 2. Telegram
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

  const CRON_SECRET = process.env.CRON_SECRET || "INATUR_CRON_SECRET";

  if (
    token !== CRON_SECRET &&
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Obtener Usuarios
    const resUsuarios = await sql(
      `SELECT u.email, u.telegram_chat_id, c.email_habilitado, c.telegram_habilitado
       FROM usuarios u
       JOIN configuracion_notificaciones c ON u.id = c.usuario_id
       WHERE u.activo = true AND (c.email_habilitado = true OR c.telegram_habilitado = true)`
    );
    const destinatarios = resUsuarios.rows;

    if (destinatarios.length === 0)
      return NextResponse.json({ message: "No hay usuarios para notificar" });

    // 2. Calcular Fechas (Strings exactos YYYY-MM-DD)
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

    // 3. Ejecución Orquestada
    if (tipoParam === "turno_manana" || tipoParam === "mismo_dia") {
      resultados.push(
        await procesarNotificacion(
          "mismo_dia",
          fechaHoy,
          "🔔 HOY:",
          destinatarios
        )
      );
    }
    if (tipoParam === "turno_manana" || tipoParam === "semana_antes") {
      resultados.push(
        await procesarNotificacion(
          "semana_antes",
          fechaSemana,
          "📅 PRÓXIMAMENTE:",
          destinatarios
        )
      );
    }
    if (tipoParam === "turno_tarde" || tipoParam === "dia_antes") {
      resultados.push(
        await procesarNotificacion(
          "dia_antes",
          fechaManana,
          "⏰ RECORDATORIO:",
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
