import { passwordResetService } from "../services/passwordResetService";
import { emailService } from "../services/emailService";
import { userService } from "./user";

function getBaseUrl(fallback?: string): string {
  return (
    fallback || process.env.NEXTAUTH_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
}

export const passwordResetInterface = {
  async requestReset(email: string, baseUrl?: string): Promise<void> {
    // Always pretend success; only send if user exists
    const user = await userService.findByEmail(email);
    const { token, expiresAt } = await passwordResetService.createToken(email, { ttlMinutes: 60 });
    if (!user) return;

    const url = getBaseUrl(baseUrl) +
      `/auth/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const subject = "Reset your password - DueNorth App";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">DueNorth App</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Homework & Assignment Tracker</p>
        </div>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 15px 0;">Hi${user.name ? ` ${user.name}` : ""},</p>
          <p style="margin: 0 0 15px 0;">You requested a password reset for your DueNorth App account.</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Your Password</a>
          </div>
          <p style="margin: 15px 0 0 0; font-size: 14px; color: #6b7280;">This password reset link will expire at ${expiresAt.toUTCString()}.</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
        <div style="text-align: center; font-size: 12px; color: #9ca3af;">
          <p>DueNorth App - Making homework management easier</p>
        </div>
      </div>
    `;
    const text = `Reset your DueNorth App password: ${url}\nThis link expires at ${expiresAt.toUTCString()}\n\nIf you didn't request this reset, you can ignore this email.`;
    await emailService.sendEmail({ to: email, subject, html, text });
  },

  async resetPassword(email: string, token: string, newPassword: string): Promise<boolean> {
    return passwordResetService.consumeTokenAndResetPassword(email, token, newPassword);
  },
};

export default passwordResetInterface;


