import { Resend } from "resend";

let cachedResend: Resend | null = null;

function hasResendConfig(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function getResend(): Resend | null {
  if (!hasResendConfig()) return null;
  if (cachedResend) return cachedResend;
  cachedResend = new Resend(process.env.RESEND_API_KEY);
  return cachedResend;
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
  provider: "smtp" | "dev" | "resend";
}

export const emailService = {
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const { to, subject, html, text } = input;

    console.log("[emailService] Attempting to send email...");
    console.log("[emailService] Environment check:");
    console.log("  RESEND_API_KEY:", process.env.RESEND_API_KEY ? "SET" : "NOT SET");

    const resend = getResend();
    console.log("[emailService] Resend client:", resend ? "CREATED" : "NULL");

    if (resend) {
      try {
        console.log("[emailService] Sending via Resend API...");
        const { data, error } = await resend.emails.send({
          from: process.env.EMAIL_FROM || "DueNorth App <noreply@duenorthapp.com>",
          to: [to],
          subject,
          html: html || text || "",
        });

        if (error) {
          console.error("[emailService] Resend API send failed:", error);
          return { success: false, provider: "resend" };
        }

        console.log("[emailService] Resend API send successful:", data?.id);
        return { success: true, messageId: data?.id, provider: "resend" };
      } catch (error) {
        console.error("[emailService] Resend API send failed:", error);
        return { success: false, provider: "resend" };
      }
    }

    // Dev fallback: log to console; don't actually send
    console.log("[emailService] Using dev fallback - no Resend configured");
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


