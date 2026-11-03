/**
 * @file GooglePayCrypto.ts
 * @description Official Google Pay ECv2 Cryptography & Signature Verification implementation.
 * Strictly adheres to Google Pay Payment Data Cryptography specification:
 * - ECDSA over NIST P-256 with SHA-256
 * - Google Root Signing Key validation (TEST and PRODUCTION)
 * - Little-endian 4-byte length prepended message concatenation
 * - ECIES-KEM (NIST P-256) + HKDF-SHA256 + AES-256-CTR decryption + HMAC-SHA256 tag verification
 * Reference: https://developers.google.com/pay/api/web/guides/resources/payment-data-cryptography
 */

import crypto from "crypto";
import { logger } from "../utils/logger";

export interface GoogleIntermediateSigningKey {
  signedKey: string;
  signatures: string[];
}

export interface GoogleSignedMessage {
  tag: string;
  ephemeralPublicKey: string;
  encryptedMessage: string;
}

export interface GooglePaymentMethodToken {
  protocolVersion: "ECv2" | string;
  signature: string;
  intermediateSigningKey: GoogleIntermediateSigningKey;
  signedMessage: string;
}

export interface GoogleDecryptedPaymentDetails {
  pan: string;
  expirationMonth: number;
  expirationYear: number;
  authMethod: "PAN_ONLY" | "CRYPTOGRAM_3DS" | string;
  cryptogram?: string;
  eciIndicator?: string;
  merchantTokenId?: string;
}

export interface GoogleDecryptedMessage {
  messageExpiration: string;
  messageId: string;
  paymentMethod: "CARD" | string;
  paymentMethodDetails: GoogleDecryptedPaymentDetails;
  gatewayMerchantId?: string;
}

/**
 * Pre-cached Google Root Public Keys (valid through 2038)
 * Enables zero-downtime offline validation without network latency.
 */
export const GOOGLE_ROOT_SIGNING_KEYS = {
  TEST: [
    {
      keyValue: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGnJ7Yo1sX9b4kr4Aa5uq58JRQfzD8bIJXw7WXaap/hVE+PnFxvjx4nVxt79SdRuUVeu++HZD0cGAv4IOznc96w==",
      protocolVersion: "ECv2",
      keyExpiration: "2154841200000",
    },
    {
      keyValue: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEGnJ7Yo1sX9b4kr4Aa5uq58JRQfzD8bIJXw7WXaap/hVE+PnFxvjx4nVxt79SdRuUVeu++HZD0cGAv4IOznc96w==",
      protocolVersion: "ECv2SigningOnly",
      keyExpiration: "2154841200000",
    },
  ],
  PRODUCTION: [
    {
      keyValue: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAElLiHStI30O9lVplgRhBN1AdlQdWyYgjQAcK3vgrqTvxs9WFkLs7CrxGge79+N5AHlklIHwlKu4WKv8E5IFX8DA==",
      protocolVersion: "ECv2",
      keyExpiration: "2154841200000",
    },
    {
      keyValue: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAElLiHStI30O9lVplgRhBN1AdlQdWyYgjQAcK3vgrqTvxs9WFkLs7CrxGge79+N5AHlklIHwlKu4WKv8E5IFX8DA==",
      protocolVersion: "ECv2SigningOnly",
      keyExpiration: "2154841200000",
    },
  ],
};

export class GooglePayCrypto {
  /**
   * Helper to write 4-byte little-endian unsigned integer
   */
  private static len4(n: number): Buffer {
    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(n, 0);
    return buf;
  }

  /**
   * Constructs signed byte buffer for intermediate signing key verification:
   * length_of_sender_id || sender_id || length_of_protocol_version || protocol_version || length_of_signed_key || signed_key
   */
  static constructIntermediateSigningKeyBytes(senderId: string, protocolVersion: string, signedKey: string): Buffer {
    return Buffer.concat([
      this.len4(Buffer.byteLength(senderId, "utf8")),
      Buffer.from(senderId, "utf8"),
      this.len4(Buffer.byteLength(protocolVersion, "utf8")),
      Buffer.from(protocolVersion, "utf8"),
      this.len4(Buffer.byteLength(signedKey, "utf8")),
      Buffer.from(signedKey, "utf8"),
    ]);
  }

  /**
   * Constructs signed byte buffer for message signature verification:
   * length_of_sender_id || sender_id || length_of_recipient_id || recipient_id || length_of_protocolVersion || protocolVersion || length_of_signedMessage || signedMessage
   */
  static constructMessageSignatureBytes(
    senderId: string,
    recipientId: string,
    protocolVersion: string,
    signedMessage: string
  ): Buffer {
    return Buffer.concat([
      this.len4(Buffer.byteLength(senderId, "utf8")),
      Buffer.from(senderId, "utf8"),
      this.len4(Buffer.byteLength(recipientId, "utf8")),
      Buffer.from(recipientId, "utf8"),
      this.len4(Buffer.byteLength(protocolVersion, "utf8")),
      Buffer.from(protocolVersion, "utf8"),
      this.len4(Buffer.byteLength(signedMessage, "utf8")),
      Buffer.from(signedMessage, "utf8"),
    ]);
  }

  /**
   * Converts base64 encoded ASN.1 SubjectPublicKeyInfo to PEM format
   */
  static toPemPublicKey(base64Key: string): string {
    return `-----BEGIN PUBLIC KEY-----\n${base64Key}\n-----END PUBLIC KEY-----`;
  }

  /**
   * Step 1 & 2: Validates the intermediate signing key against Google's Root Signing Keys
   */
  static verifyIntermediateSigningKey(
    intermediateKey: GoogleIntermediateSigningKey,
    environment: "TEST" | "PRODUCTION" = "TEST"
  ): { isValid: boolean; parsedKey?: { keyExpiration: string; keyValue: string } } {
    try {
      const parsedSignedKey = JSON.parse(intermediateKey.signedKey);
      const expiration = Number(parsedSignedKey.keyExpiration);

      // Verify intermediate key has not expired
      if (Date.now() >= expiration) {
        logger.warn(`Google intermediate signing key expired at ${expiration}`);
        return { isValid: false };
      }

      const signedBytes = this.constructIntermediateSigningKeyBytes("Google", "ECv2", intermediateKey.signedKey);
      const rootKeys = GOOGLE_ROOT_SIGNING_KEYS[environment] || GOOGLE_ROOT_SIGNING_KEYS.TEST;

      for (const rootKey of rootKeys) {
        if (Number(rootKey.keyExpiration) < Date.now()) continue;

        const pemKey = this.toPemPublicKey(rootKey.keyValue);

        for (const sig of intermediateKey.signatures) {
          try {
            const verifier = crypto.createVerify("SHA256");
            verifier.update(signedBytes);
            if (verifier.verify(pemKey, sig, "base64")) {
              return { isValid: true, parsedKey: parsedSignedKey };
            }
          } catch {
            // Check next signature
          }
        }
      }

      return { isValid: false };
    } catch (err: any) {
      logger.error(`Error verifying intermediate signing key: ${err.message}`);
      return { isValid: false };
    }
  }

  /**
   * Step 3: Verifies the message signature using the verified intermediate signing key
   */
  static verifyMessageSignature(
    token: GooglePaymentMethodToken,
    intermediateKeyValue: string,
    recipientId: string
  ): boolean {
    try {
      const intermediatePem = this.toPemPublicKey(intermediateKeyValue);
      const messageBytes = this.constructMessageSignatureBytes(
        "Google",
        recipientId,
        token.protocolVersion,
        token.signedMessage
      );

      const verifier = crypto.createVerify("SHA256");
      verifier.update(messageBytes);
      return verifier.verify(intermediatePem, token.signature, "base64");
    } catch (err: any) {
      logger.error(`Error verifying message signature: ${err.message}`);
      return false;
    }
  }

  /**
   * Step 4: Decrypts Google Pay ECv2 encrypted message using merchant private key
   * ECIES-KEM (P-256) + HKDF-SHA256 + AES-256-CTR + HMAC-SHA256
   */
  static decryptToken(
    signedMessageStr: string,
    merchantPrivateKeyPem: string
  ): GoogleDecryptedMessage | null {
    try {
      const signedMessage: GoogleSignedMessage = JSON.parse(signedMessageStr);
      const ephemeralPubKeyBytes = Buffer.from(signedMessage.ephemeralPublicKey, "base64");
      const encryptedMsgBytes = Buffer.from(signedMessage.encryptedMessage, "base64");
      const tagBytes = Buffer.from(signedMessage.tag, "base64");

      // 1. Compute ECDH shared secret using merchant private key & ephemeral public key
      const ecdh = crypto.createECDH("prime256v1");
      // Set private key from PEM or PKCS8
      const privKeyObj = crypto.createPrivateKey(merchantPrivateKeyPem);
      const jwk = privKeyObj.export({ format: "jwk" });
      if (!jwk.d) throw new Error("Invalid private key format");
      ecdh.setPrivateKey(Buffer.from(jwk.d, "base64url"));

      const sharedSecret = ecdh.computeSecret(ephemeralPubKeyBytes);

      // 2. HKDF with SHA256: salt = 32 zero bytes, info = "Google", length = 64 bytes (32 AES + 32 MAC)
      const hkdfKey = crypto.hkdfSync(
        "sha256",
        sharedSecret,
        Buffer.alloc(32, 0),
        Buffer.from("Google", "ascii"),
        64
      );

      const aesKey = Buffer.from(hkdfKey).subarray(0, 32);
      const macKey = Buffer.from(hkdfKey).subarray(32, 64);

      // 3. Verify HMAC-SHA256 tag in constant time
      const hmac = crypto.createHmac("sha256", macKey);
      hmac.update(encryptedMsgBytes);
      const computedTag = hmac.digest();

      if (!crypto.timingSafeEqual(computedTag, tagBytes)) {
        logger.error("Google Pay token MAC tag verification failed");
        return null;
      }

      // 4. Decrypt AES-256-CTR with zero IV
      const decipher = crypto.createDecipheriv("aes-256-ctr", aesKey, Buffer.alloc(16, 0));
      const decryptedBuf = Buffer.concat([decipher.update(encryptedMsgBytes), decipher.final()]);
      const decryptedJson: GoogleDecryptedMessage = JSON.parse(decryptedBuf.toString("utf8"));

      // 5. Verify message expiration
      if (Number(decryptedJson.messageExpiration) < Date.now()) {
        logger.warn(`Decrypted Google Pay message expired at ${decryptedJson.messageExpiration}`);
        return null;
      }

      return decryptedJson;
    } catch (err: any) {
      logger.error(`Google Pay token decryption failed: ${err.message}`);
      return null;
    }
  }
}
