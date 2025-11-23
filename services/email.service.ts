// /services/email.service.ts
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true, // true para puerto 465 (SSL), false para otros
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  /**
   * Envía un correo electrónico con formato HTML.
   */
  static async enviarCorreo(
    destinatario: string,
    asunto: string,
    htmlBody: string
  ): Promise<boolean> {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.error("[Email] Faltan credenciales SMTP en el .env");
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: SMTP_FROM,
        to: destinatario,
        subject: asunto,
        html: htmlBody,
      });

      console.log(
        `[Email] Correo enviado a ${destinatario}: ${info.messageId}`
      );
      return true;
    } catch (error) {
      console.error("[Email] Error enviando correo:", error);
      return false;
    }
  }
}
