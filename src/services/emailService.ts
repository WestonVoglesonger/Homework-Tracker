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

  async sendWaitlistWelcomeEmail(email: string, name?: string): Promise<SendEmailResult> {
    const displayName = name || "there";

    const subject = "Welcome to the DueNorth Waitlist!";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to the DueNorth Waitlist!</h1>

        <p>Hi ${displayName},</p>

        <p>Thank you for your interest in DueNorth! You've been successfully added to our waitlist.</p>

        <p><strong>What happens next?</strong></p>
        <ul>
          <li>You'll receive an email when we have space for new users</li>
          <li>You can still access our public pages in the meantime</li>
          <li>Your account information is secure and ready for activation</li>
        </ul>

        <p>We appreciate your patience and look forward to having you join our community!</p>

        <p>Best regards,<br>The DueNorth Team</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

        <p style="font-size: 12px; color: #6b7280;">
          This email was sent to ${email}. If you didn't sign up for DueNorth, please ignore this email.
        </p>
      </div>
    `;

    const text = `
      Welcome to the DueNorth Waitlist!

      Hi ${displayName},

      Thank you for your interest in DueNorth! You've been successfully added to our waitlist.

      What happens next?
      - You'll receive an email when we have space for new users
      - You can still access our public pages in the meantime
      - Your account information is secure and ready for activation

      We appreciate your patience and look forward to having you join our community!

      Best regards,
      The DueNorth Team

      ---
      This email was sent to ${email}. If you didn't sign up for DueNorth, please ignore this email.
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  },

  async sendWaitlistConversionEmail(email: string, name?: string): Promise<SendEmailResult> {
    const displayName = name || "there";

    const subject = "Welcome to DueNorth - Your Account is Now Active!";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to DueNorth!</h1>

        <p>Hi ${displayName},</p>

        <p>Great news! You've been selected from our waitlist and your DueNorth account is now fully activated.</p>

        <p><strong>What you can do now:</strong></p>
        <ul>
          <li>Access all features of DueNorth</li>
          <li>Set up your Canvas integration</li>
          <li>Create courses and assignments</li>
          <li>Track your academic progress</li>
        </ul>

        <p>Get started by logging into your account and exploring all the features!</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || 'https://duenorthapp.com'}/auth/signin"
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Sign In to Your Account
          </a>
        </div>

        <p>Welcome to the DueNorth community!</p>

        <p>Best regards,<br>The DueNorth Team</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

        <p style="font-size: 12px; color: #6b7280;">
          This email was sent to ${email}.
        </p>
      </div>
    `;

    const text = `
      Welcome to DueNorth - Your Account is Now Active!

      Hi ${displayName},

      Great news! You've been selected from our waitlist and your DueNorth account is now fully activated.

      What you can do now:
      - Access all features of DueNorth
      - Set up your Canvas integration
      - Create courses and assignments
      - Track your academic progress

      Get started by logging into your account at: ${process.env.NEXTAUTH_URL || 'https://duenorthapp.com'}/auth/signin

      Welcome to the DueNorth community!

      Best regards,
      The DueNorth Team

      ---
      This email was sent to ${email}.
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  },
};

export default emailService;


