import crypto from "crypto";

const getMasterKey = () => {
  // 32-byte key required for AES-256
  const key = process.env.ENCRYPTION_KEY || "e8b2f9a7c4d16309f8e4a2b1c3d5f70a"; 
  return Buffer.from(key, "utf-8").slice(0, 32);
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
