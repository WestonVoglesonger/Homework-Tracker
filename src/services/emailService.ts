import type { Transporter } from "nodemailer";

let cachedTransporter: Transporter | null = null;

function hasSmtpConfig(): boolean {
  return Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM);
}

async function getTransporter(): Promise<Transporter | null> {
  if (!hasSmtpConfig()) return null;
  if (cachedTransporter) return cachedTransporter;
  const nodemailer = await import("nodemailer");
  // EMAIL_SERVER can be a connection URI per Nodemailer docs
  const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER as string);
  cachedTransporter = transporter;
  return transporter;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  provider: "smtp" | "dev";
}

export const emailService = {
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const { to, subject, html, text } = input;

    const transporter = await getTransporter();
    if (transporter) {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM!,
        to,
        subject,
        text: text || undefined,
        html: html || undefined,
      });
      return { success: true, messageId: info?.messageId, provider: "smtp" };
    }

    // Dev fallback: log to console; don't actually send
    const preview = {
      from: process.env.EMAIL_FROM || "dev@example.com",
      to,
      subject,
      text: text || "",
      html: html || "",
    };
    // eslint-disable-next-line no-console
    console.info("[emailService] Dev email fallback:", preview);
    return { success: true, provider: "dev" };
  },
};

export default emailService;


