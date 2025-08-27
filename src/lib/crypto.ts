import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

function getKeyBuffer(): Buffer {
  const envKey = process.env.TOKEN_ENCRYPTION_KEY || process.env.CANVAS_TOKEN_KEY;
  if (envKey) {
    try {
      // Try base64
      const b64 = Buffer.from(envKey, "base64");
      if (b64.length === 32) return b64;
    } catch {}
    try {
      // Try hex
      if (/^[0-9a-fA-F]+$/.test(envKey) && envKey.length === 64) {
        return Buffer.from(envKey, "hex");
      }
    } catch {}
    // Fallback: derive from utf8 string (not ideal, but better than nothing)
    return createHash("sha256").update(envKey, "utf8").digest();
  }
  // Dev fallback: derive from NEXTAUTH_SECRET; in production, require explicit key
  const basis = process.env.NEXTAUTH_SECRET || "dev-fallback-key";
  const key = createHash("sha256").update(basis, "utf8").digest();
  if (process.env.NODE_ENV === "production") {
    // In production, encourage setting a dedicated key
    console.warn("TOKEN_ENCRYPTION_KEY is not set. Using derived key from NEXTAUTH_SECRET.");
  }
  return key;
}

export function encryptText(plaintext: string): string {
  const key = getKeyBuffer();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const packed = Buffer.concat([iv, tag, ciphertext]).toString("base64");
  return `v1:${packed}`;
}

export function decryptText(packed: string): string {
  if (!packed) return "";
  if (!packed.startsWith("v1:")) {
    return packed; // backward-compat plain text
  }
  const b64 = packed.slice(3);
  const buf = Buffer.from(b64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const key = getKeyBuffer();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  return plaintext;
}


