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
    const user = await userService.findByEmail(email);
    // Always behave the same regardless of existence; only send if it makes sense
    if (!user || user.emailVerified) {
      return;
    }
    const { token, expiresAt } = await verificationService.createToken(email, { ttlMinutes: 60 * 24 });
    const url = getBaseUrl(baseUrl) +
      `/api/auth/verify/confirm?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const subject = "Verify your email";
    const html = `
      <p>Hi${user.name ? ` ${user.name}` : ""},</p>
      <p>Please verify your email for Homework Tracker.</p>
      <p><a href="${url}">Click here to verify your email</a></p>
      <p>This link expires at ${expiresAt.toUTCString()}.</p>
    `;
    const text = `Verify your email: ${url}\nThis link expires at ${expiresAt.toUTCString()}`;
    await emailService.sendEmail({ to: email, subject, html, text });
  },

  async confirmVerification(email: string, token: string): Promise<boolean> {
    return verificationService.consumeToken(email, token);
  },
};

export default verificationInterface;


