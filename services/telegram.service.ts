// /services/telegram.service.ts

const TELEGRAM_API_URL = "https://api.telegram.org/bot";
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export class TelegramService {
  /**
   * Envía un mensaje de texto a un chat específico.
   */
  static async enviarMensaje(
    chatId: string,
    mensaje: string
  ): Promise<boolean> {
    if (!TOKEN) {
      console.error("[Telegram] No hay token configurado.");
      return false;
    }

    try {
      const url = `${TELEGRAM_API_URL}${TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: mensaje,
          parse_mode: "HTML", // Permite usar negritas <b> y cursivas <i>
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        console.error("[Telegram] Error API:", data.description);
        return false;
      }

      return true;
    } catch (error) {
      console.error("[Telegram] Error de red:", error);
      return false;
    }
  }
}
