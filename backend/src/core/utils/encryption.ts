import crypto from "crypto";

const getMasterKey = (): Buffer => {
  // Derive a strong 32-byte key using SHA-256 from environment secret
  const key = process.env.ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY or JWT_ACCESS_SECRET environment variable is required");
    }
    // Safe deterministic key derived at runtime for local testing only
    return crypto.createHash("sha256").update("s4r-local-dev-fallback-key").digest();
  }
  return crypto.createHash("sha256").update(key).digest();
};

export const encrypt = (text: string | undefined | null): string => {
  if (!text) return "";
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", getMasterKey(), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${encrypted}:${authTag}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    return text;
  }
};

export const decrypt = (encryptedText: string | undefined | null): string => {
  if (!encryptedText) return "";
  if (!encryptedText.includes(":")) return encryptedText; // Legacy unencrypted fallback
  try {
    const [ivHex, encryptedHex, authTagHex] = encryptedText.split(":");
    const decipher = crypto.createDecipheriv("aes-256-gcm", getMasterKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
};
