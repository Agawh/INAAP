// /services/notificaciones.service.ts
import { sql } from "@/lib/db";
import { TelegramService } from "./telegram.service";

// Tipo de notificación que vamos a procesar
type TipoAlerta = "semana_antes" | "noche_anterior" | "mismo_dia";

export class NotificacionesService {
  /**
   * Ejecuta el proceso de verificar y enviar notificaciones masivas.
   * @param tipo Define qué regla de tiempo aplicar
   */
  static async procesarNotificaciones(tipo: TipoAlerta) {
    console.log(`[Notificaciones] Iniciando proceso global: ${tipo}`);

    // 1. Definir la fecha objetivo según la regla
    let filtroFechaSQL = "";
    let mensajeIntro = "";

    switch (tipo) {
      case "semana_antes": // 7 días antes
        filtroFechaSQL = "fecha_inicio = CURRENT_DATE + INTERVAL '7 days'";
        mensajeIntro =
          "📅 <b>Recordatorio Semanal:</b> Actividad programada en 7 días.";
        break;

      case "noche_anterior": // Noche anterior
        filtroFechaSQL = "fecha_inicio = CURRENT_DATE + INTERVAL '1 day'";
        mensajeIntro =
          "🌙 <b>Para Mañana:</b> Actividad pendiente en el cronograma.";
        break;

      case "mismo_dia": // Mismo día
        filtroFechaSQL = "fecha_inicio = CURRENT_DATE";
        mensajeIntro = "☀️ <b>Buen día:</b> Actividad programada para hoy.";
        break;
    }

    // 2. Buscar actividades y usuarios (LÓGICA GLOBAL)
    // Esta consulta hace un producto cartesiano (CROSS JOIN implícito)
    // entre las actividades del día y TODOS los usuarios con notificaciones activas.
    const query = `
      SELECT 
        a.id as actividad_id,
        a.titulo,
        a.fecha_inicio,
        u.id as usuario_id,
        u.nombre_completo,
        u.telegram_chat_id
      FROM actividades a
      CROSS JOIN usuarios u
      JOIN configuracion_notificaciones cn ON u.id = cn.usuario_id
      WHERE 
        ${filtroFechaSQL}
        AND a.estado IN ('pendiente', 'en_progreso')
        AND cn.telegram_habilitado = true
        AND u.telegram_chat_id IS NOT NULL
        AND u.activo = true
    `;

    const resultados = await sql(query);
    const envios = resultados.rows;

    console.log(
      `[Notificaciones] Se encontraron ${envios.length} alertas para enviar.`
    );

    // 3. Enviar mensajes
    let enviados = 0;
    let fallidos = 0;

    for (const envio of envios) {
      const cuerpoMensaje = `
${mensajeIntro}

📌 <b>${envio.titulo}</b>
📅 Fecha: ${new Date(envio.fecha_inicio).toLocaleDateString("es-ES")}

<i>Sistema de Gestión INATUR</i>
      `.trim();

      const exito = await TelegramService.enviarMensaje(
        envio.telegram_chat_id,
        cuerpoMensaje
      );

      // Registrar en historial
      await sql(
        `
        INSERT INTO notificaciones (actividad_id, usuario_id, canal, estado, enviada_en, mensaje_error)
        VALUES ($1, $2, 'telegram', $3, NOW(), $4)
      `,
        [
          envio.actividad_id,
          envio.usuario_id,
          exito ? "enviada" : "fallida",
          exito ? null : "Error de API Telegram",
        ]
      );

      if (exito) enviados++;
      else fallidos++;
    }

    return { enviados, fallidos };
  }
}
