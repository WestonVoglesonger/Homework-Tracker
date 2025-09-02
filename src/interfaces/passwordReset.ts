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
    const subject = "Reset your Homework Tracker password";
    const html = `
      <p>Hi${user.name ? ` ${user.name}` : ""},</p>
      <p>You requested a password reset for Homework Tracker.</p>
      <p><a href="${url}">Click here to reset your password</a></p>
      <p>This link expires at ${expiresAt.toUTCString()}.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `;
    const text = `Reset your password: ${url}\nThis link expires at ${expiresAt.toUTCString()}`;
    await emailService.sendEmail({ to: email, subject, html, text });
  },

  async resetPassword(email: string, token: string, newPassword: string): Promise<boolean> {
    return passwordResetService.consumeTokenAndResetPassword(email, token, newPassword);
  },
};

export default passwordResetInterface;


