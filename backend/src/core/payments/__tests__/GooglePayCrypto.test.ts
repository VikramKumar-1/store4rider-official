import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  GooglePayCrypto,
  GOOGLE_ROOT_SIGNING_KEYS,
  GooglePaymentMethodToken,
} from "../GooglePayCrypto";

describe("GooglePayCrypto - Official Google Pay ECv2 Payment Data Cryptography", () => {
  describe("Root Signing Keys", () => {
    it("should provide valid ECv2 root signing keys for TEST and PRODUCTION", () => {
      expect(GOOGLE_ROOT_SIGNING_KEYS.TEST.length).toBeGreaterThan(0);
      expect(GOOGLE_ROOT_SIGNING_KEYS.PRODUCTION.length).toBeGreaterThan(0);

      const testKey = GOOGLE_ROOT_SIGNING_KEYS.TEST.find((k) => k.protocolVersion === "ECv2");
      expect(testKey).toBeDefined();
      expect(Number(testKey?.keyExpiration)).toBeGreaterThan(Date.now());

      const prodKey = GOOGLE_ROOT_SIGNING_KEYS.PRODUCTION.find((k) => k.protocolVersion === "ECv2");
      expect(prodKey).toBeDefined();
      expect(Number(prodKey?.keyExpiration)).toBeGreaterThan(Date.now());
    });
  });

  describe("Byte-string construction for signature verification", () => {
    it("should construct intermediate key signature bytes matching 4-byte LE length specification", () => {
      const senderId = "Google";
      const protocolVersion = "ECv2";
      const signedKey = JSON.stringify({ keyExpiration: "2000000000000", keyValue: "testKey" });

      const bytes = GooglePayCrypto.constructIntermediateSigningKeyBytes(senderId, protocolVersion, signedKey);

      // Verify little-endian 4-byte prefix: 06 00 00 00 for 'Google' (len 6)
      expect(bytes.readUInt32LE(0)).toBe(6);
      expect(bytes.subarray(4, 10).toString("utf8")).toBe("Google");

      // Verify little-endian 4-byte for 'ECv2' (len 4)
      expect(bytes.readUInt32LE(10)).toBe(4);
      expect(bytes.subarray(14, 18).toString("utf8")).toBe("ECv2");

      // Verify signedKey length and content
      expect(bytes.readUInt32LE(18)).toBe(Buffer.byteLength(signedKey, "utf8"));
    });

    it("should construct message signature bytes matching 4-byte LE length specification", () => {
      const senderId = "Google";
      const recipientId = "merchant:Store4Riders";
      const protocolVersion = "ECv2";
      const signedMessage = JSON.stringify({ tag: "abc", encryptedMessage: "xyz" });

      const bytes = GooglePayCrypto.constructMessageSignatureBytes(
        senderId,
        recipientId,
        protocolVersion,
        signedMessage
      );

      expect(bytes.readUInt32LE(0)).toBe(6);
      expect(bytes.subarray(4, 10).toString("utf8")).toBe("Google");

      expect(bytes.readUInt32LE(10)).toBe(Buffer.byteLength(recipientId, "utf8"));
      expect(bytes.subarray(14, 14 + Buffer.byteLength(recipientId, "utf8")).toString("utf8")).toBe(recipientId);
    });
  });

  describe("Intermediate Signing Key Expiration", () => {
    it("should reject intermediate signing key if expired", () => {
      const expiredKey = {
        signedKey: JSON.stringify({ keyExpiration: "1000000000000", keyValue: "oldKey" }), // year 2001
        signatures: ["MEQCIC4..."],
      };

      const result = GooglePayCrypto.verifyIntermediateSigningKey(expiredKey, "TEST");
      expect(result.isValid).toBe(false);
    });
  });

  describe("Decryption & ECIES-KEM (P-256) Primitives", () => {
    it("should reject tampered HMAC-SHA256 tag during decryption", () => {
      // Generate a test EC P-256 key pair
      const { privateKey } = (crypto as any).generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });

      const fakeSignedMessage = JSON.stringify({
        tag: Buffer.from("invalid_tampered_tag_32_bytes_12345678").toString("base64"),
        ephemeralPublicKey: Buffer.alloc(65, 4).toString("base64"),
        encryptedMessage: Buffer.from("fake_ciphertext").toString("base64"),
      });

      const result = GooglePayCrypto.decryptToken(fakeSignedMessage, privateKey);
      expect(result).toBeNull();
    });
  });
});
