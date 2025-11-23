// /services/notificaciones.service.ts
import { sql } from "@/lib/db";
import { TelegramService } from "./telegram.service";
import { EmailService } from "./email.service"; // <-- Importamos el servicio de Email

type TipoAlerta = "semana_antes" | "noche_anterior" | "mismo_dia";

export class NotificacionesService {
  static async procesarNotificaciones(tipo: TipoAlerta) {
    console.log(`[Notificaciones] Iniciando proceso global: ${tipo}`);

    let filtroFechaSQL = "";
    let mensajeIntro = "";
    let asuntoEmail = ""; // Asunto específico para el correo

    switch (tipo) {
      case "semana_antes":
        filtroFechaSQL = "fecha_inicio = CURRENT_DATE + INTERVAL '7 days'";
        mensajeIntro =
          "📅 <b>Recordatorio Semanal:</b> Actividad programada en 7 días.";
        asuntoEmail = "📅 Recordatorio: Actividad en 7 días";
        break;

      case "noche_anterior":
        filtroFechaSQL = "fecha_inicio = CURRENT_DATE + INTERVAL '1 day'";
        mensajeIntro =
          "🌙 <b>Para Mañana:</b> Actividad pendiente en el cronograma.";
        asuntoEmail = "🌙 Recordatorio: Actividad para mañana";
        break;

      case "mismo_dia":
        filtroFechaSQL = "fecha_inicio = CURRENT_DATE";
        mensajeIntro = "☀️ <b>Buen día:</b> Actividad programada para hoy.";
        asuntoEmail = "☀️ Agenda del día: Actividad programada";
        break;
    }

    // 2. Buscar actividades y usuarios (LÓGICA GLOBAL + EMAIL)
    // Actualizamos la consulta para traer el email y los permisos de configuración
    const query = `
      SELECT 
        a.id as actividad_id,
        a.titulo,
        a.fecha_inicio,
        a.descripcion, 
        u.id as usuario_id,
        u.nombre_completo,
        u.telegram_chat_id,
        u.email,
        cn.telegram_habilitado,
        cn.email_habilitado
      FROM actividades a
      CROSS JOIN usuarios u
      JOIN configuracion_notificaciones cn ON u.id = cn.usuario_id
      WHERE 
        ${filtroFechaSQL}
        AND a.estado IN ('pendiente', 'en_progreso')
        AND u.activo = true
        AND (
          (cn.telegram_habilitado = true AND u.telegram_chat_id IS NOT NULL)
          OR
          (cn.email_habilitado = true AND u.email IS NOT NULL)
        )
    `;

    const resultados = await sql(query);
    const envios = resultados.rows;

    console.log(
      `[Notificaciones] Se encontraron ${envios.length} posibles envíos.`
    );

    let enviados = 0;
    let fallidos = 0;

    for (const envio of envios) {
      const fechaFormateada = new Date(envio.fecha_inicio).toLocaleDateString(
        "es-ES",
        { dateStyle: "full" }
      );

      // --- A. Enviar por TELEGRAM (Si corresponde) ---
      if (envio.telegram_habilitado && envio.telegram_chat_id) {
        const cuerpoTelegram = `
${mensajeIntro}

📌 <b>${envio.titulo}</b>
📅 Fecha: ${fechaFormateada}

<i>Sistema de Gestión INATUR</i>
        `.trim();

        const exitoTel = await TelegramService.enviarMensaje(
          envio.telegram_chat_id,
          cuerpoTelegram
        );

        // Registrar intento Telegram
        await registrarNotificacion(
          envio.actividad_id,
          envio.usuario_id,
          "telegram",
          exitoTel
        );
        if (exitoTel) enviados++;
        else fallidos++;
      }

      // --- B. Enviar por EMAIL (Si corresponde) ---
      if (envio.email_habilitado && envio.email) {
        // Creamos un HTML simple pero limpio para el correo
        const cuerpoEmail = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a2a5a;">${asuntoEmail}</h2>
            <p>Hola <strong>${envio.nombre_completo}</strong>,</p>
            <p>${mensajeIntro.replace(/<[^>]*>/g, "")}</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #d4af37;">${envio.titulo}</h3>
              <p><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
              ${
                envio.descripcion
                  ? `<p><strong>📝 Descripción:</strong><br/>${envio.descripcion}</p>`
                  : ""
              }
            </div>
            
            <p style="font-size: 12px; color: #666;">
              Este es un mensaje automático del Sistema de Gestión de Actividades INATUR.
            </p>
          </div>
        `;

        const exitoEmail = await EmailService.enviarCorreo(
          envio.email,
          `${asuntoEmail}: ${envio.titulo}`,
          cuerpoEmail
        );

        // Registrar intento Email
        await registrarNotificacion(
          envio.actividad_id,
          envio.usuario_id,
          "email",
          exitoEmail
        );
        if (exitoEmail) enviados++;
        else fallidos++;
      }
    }

    return {
      total_procesados: envios.length,
      envios_totales: enviados,
      fallos: fallidos,
    };
  }
}

// Función auxiliar para registrar en la BD (para no repetir código)
async function registrarNotificacion(
  actividadId: string,
  usuarioId: string,
  canal: string,
  exito: boolean
) {
  try {
    await sql(
      `
      INSERT INTO notificaciones (actividad_id, usuario_id, canal, estado, enviada_en, mensaje_error)
      VALUES ($1, $2, $3, $4, NOW(), $5)
    `,
      [
        actividadId,
        usuarioId,
        canal,
        exito ? "enviada" : "fallida",
        exito ? null : `Error de envío ${canal}`,
      ]
    );
  } catch (error) {
    console.error(`Error registrando notificación (${canal}):`, error);
  }
}
