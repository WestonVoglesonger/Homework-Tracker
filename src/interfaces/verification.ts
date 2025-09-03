import { userService } from "./user";
import { verificationService } from "../services/verificationService";
import { emailService } from "../services/emailService";

function getBaseUrl(fallback?: string): string {
  return (
    fallback || process.env.NEXTAUTH_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
}

export const verificationInterface = {
  async requestVerification(email: string, baseUrl?: string): Promise<void> {
    console.log("[verificationInterface] Requesting verification for:", email);

    const user = await userService.findByEmail(email);
    console.log("[verificationInterface] User found:", user ? "YES" : "NO");
    console.log("[verificationInterface] User verified:", user?.emailVerified);

    // Always behave the same regardless of existence; only send if it makes sense
    if (!user || user.emailVerified) {
      console.log("[verificationInterface] Skipping email - user doesn't exist or already verified");
      return;
    }

    console.log("[verificationInterface] Creating verification token...");
    const { token, expiresAt } = await verificationService.createToken(email, { ttlMinutes: 60 * 24 });
    console.log("[verificationInterface] Token created, expires:", expiresAt);

    const url = getBaseUrl(baseUrl) +
      `/api/auth/verify/confirm?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    console.log("[verificationInterface] Verification URL:", url);

    const subject = "Verify your email - DueNorth App";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">DueNorth App</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Homework & Assignment Tracker</p>
        </div>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 15px 0;">Hi${user.name ? ` ${user.name}` : ""},</p>
          <p style="margin: 0 0 15px 0;">Welcome to DueNorth App! Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Your Email</a>
          </div>
          <p style="margin: 15px 0 0 0; font-size: 14px; color: #6b7280;">This verification link will expire at ${expiresAt.toUTCString()}.</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">If you didn't create an account with DueNorth App, you can safely ignore this email.</p>
        </div>
        <div style="text-align: center; font-size: 12px; color: #9ca3af;">
          <p>DueNorth App - Making homework management easier</p>
        </div>
      </div>
    `;
    const text = `Verify your email for DueNorth App: ${url}\nThis link expires at ${expiresAt.toUTCString()}\n\nIf you didn't create an account, you can ignore this email.`;

    console.log("[verificationInterface] Calling email service...");
    const result = await emailService.sendEmail({ to: email, subject, html, text });
    console.log("[verificationInterface] Email service result:", result);
  },

  async confirmVerification(email: string, token: string): Promise<boolean> {
    return verificationService.consumeToken(email, token);
  },
};

export default verificationInterface;


