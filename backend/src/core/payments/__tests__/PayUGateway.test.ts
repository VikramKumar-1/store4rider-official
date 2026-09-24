import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { PayUGateway } from '../PayUGateway';
import { AppError } from '../../errors/AppError';

// Mock the environment variables
vi.mock('../../config/env', () => ({
  ENV: {
    PAYU_MERCHANT_KEY: 'test_key',
    PAYU_SALT: 'test_salt',
    NEXT_PUBLIC_API_URL: 'http://localhost:3000'
  }
}));

describe('PayUGateway - Edge Cases & Security (Step 12)', () => {
  let gateway: PayUGateway;

  beforeEach(() => {
    gateway = new PayUGateway();
    vi.clearAllMocks();
  });

  describe('Amount Tampering & Signature Spoofing', () => {
    it('should reject payment if the signature hash is invalid (Spoofing Attack)', async () => {
      const mockPayment: any = { amount: 5000 };
      const verificationData = {
        status: 'success',
        txnid: 'txn_123',
        amount: '5000.00',
        productinfo: 'Helmet',
        firstname: 'Test',
        email: 'test@example.com',
        hash: 'invalid_fake_hash', // Hacker sends a fake hash
        mihpayid: 'payu_999'
      };

      const result = await gateway.verifyPayment(mockPayment, verificationData);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid PayU signature');
    });

    it('should reject payment if the paid amount is less than the database amount (Amount Tampering)', async () => {
      const dbPaymentAmount = 50000; // Original amount Rs 50,000
      const mockPayment: any = { amount: dbPaymentAmount };
      
      // Hacker manipulated frontend to charge Rs 10 instead
      const verificationData = {
        status: 'success',
        txnid: 'txn_123',
        amount: '10.00', 
        productinfo: 'Helmet',
        firstname: 'Test',
        email: 'test@example.com',
        hash: '', // We will generate the CORRECT hash for Rs 10 to simulate a real PayU response for the tampered amount
        mihpayid: 'payu_999'
      };

      // Generate valid hash for the tampered amount
      const salt = 'test_salt';
      const key = 'test_key';
      const hashString = `${salt}|success|||||||||||test@example.com|Test|Helmet|10.00|txn_123|${key}`;
      verificationData.hash = crypto.createHash("sha512").update(hashString).digest("hex");

      const result = await gateway.verifyPayment(mockPayment, verificationData);
      
      // The hash is technically valid, BUT our backend should catch the amount mismatch!
      expect(result.success).toBe(false);
      expect(result.message).toBe('Amount mismatch detected');
    });

    it('should accept payment if signature is valid and amount matches exactly', async () => {
      const mockPayment: any = { amount: 5000 };
      
      const verificationData = {
        status: 'success',
        txnid: 'txn_123',
        amount: '5000', 
        productinfo: 'Helmet',
        firstname: 'Test',
        email: 'test@example.com',
        hash: '', 
        mihpayid: 'payu_999'
      };

      const hashString = `test_salt|success|||||||||||test@example.com|Test|Helmet|5000|txn_123|test_key`;
      verificationData.hash = crypto.createHash("sha512").update(hashString).digest("hex");

      const result = await gateway.verifyPayment(mockPayment, verificationData);
      
      expect(result.success).toBe(true);
      expect(result.gatewayPaymentId).toBe('payu_999');
    });
  });
});
