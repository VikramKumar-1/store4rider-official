import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GooglePayUpiGateway } from '../GooglePayUpiGateway';
import { PaymentGatewayFactory } from '../PaymentGatewayFactory';
import { SettingRepository } from '../../../modules/settings/setting.repository';
import { PaymentRepository } from '../../../modules/payment/payment.repository';
import { AppError } from '../../errors/AppError';

// Mock SettingRepository & PaymentRepository
vi.mock('../../../modules/settings/setting.repository', () => ({
  SettingRepository: {
    getSettings: vi.fn(),
  },
}));

vi.mock('../../../modules/payment/payment.repository', () => ({
  PaymentRepository: {
    findByGatewayOrderId: vi.fn(),
  },
}));

describe('GooglePayUpiGateway & Factory - Production Direct UPI Architecture', () => {
  let gateway: GooglePayUpiGateway;

  beforeEach(() => {
    gateway = new GooglePayUpiGateway();
    vi.clearAllMocks();

    vi.mocked(SettingRepository.getSettings).mockResolvedValue({
      upiMerchantVpa: 'store4riders@icici',
      upiMerchantName: 'Store4Riders India',
      upiMcc: '5941',
      googlePayMerchantId: 'BCR2DN-TEST-MERCHANT-ID',
      legalBusinessName: 'Store4Riders',
    } as any);
  });

  describe('PaymentGatewayFactory registration', () => {
    it('should return GooglePayUpiGateway instance for "upi" gateway type', () => {
      const instance = PaymentGatewayFactory.create('upi');
      expect(instance).toBeInstanceOf(GooglePayUpiGateway);
    });

    it('should return GooglePayUpiGateway instance for "gpay" gateway type', () => {
      const instance = PaymentGatewayFactory.create('gpay');
      expect(instance).toBeInstanceOf(GooglePayUpiGateway);
    });
  });

  describe('createOrder() - NPCI & Google Pay India Standard Payloads', () => {
    it('should generate valid NPCI UPI Intent URI and Google Pay India API v2 structure', async () => {
      const mockOrder: any = {
        orderNumber: 'OD-S4R-202611-1001',
      };

      const result = await gateway.createOrder(mockOrder, 4999.0);

      expect(result.gatewayOrderId).toBe('OD-S4R-202611-1001');
      expect(result.gatewayResponse.gateway).toBe('upi');
      expect(result.gatewayResponse.amount).toBe(4999.0);

      // Verify NPCI UPI URI
      const uri = result.gatewayResponse.upiUri;
      expect(uri).toContain('upi://pay?');
      expect(uri).toContain('pa=store4riders%40icici');
      expect(uri).toContain('pn=Store4Riders%20India');
      expect(uri).toContain('mc=5941');
      expect(uri).toContain('tr=OD-S4R-202611-1001');
      expect(uri).toContain('am=4999.00');
      expect(uri).toContain('cu=INR');

      // Verify Google Pay India v2 API Request
      const gpay = result.gatewayResponse.googlePayRequest;
      expect(gpay.apiVersion).toBe(2);
      expect(gpay.apiVersionMinor).toBe(0);
      expect(gpay.allowedPaymentMethods[0].type).toBe('UPI');
      expect(gpay.allowedPaymentMethods[0].tokenizationSpecification.type).toBe('DIRECT');
      expect(gpay.allowedPaymentMethods[0].parameters.payeeVpa).toBe('store4riders@icici');
      expect(gpay.allowedPaymentMethods[0].parameters.transactionReferenceId).toBe('OD-S4R-202611-1001');
      expect(gpay.transactionInfo.totalPrice).toBe('4999.00');
      expect(gpay.transactionInfo.currencyCode).toBe('INR');
    });

    it('should throw AppError if Merchant VPA is not configured', async () => {
      vi.mocked(SettingRepository.getSettings).mockResolvedValue({
        upiMerchantVpa: '',
      } as any);

      const mockOrder: any = { orderNumber: 'OD-S4R-FAIL' };
      await expect(gateway.createOrder(mockOrder, 1500)).rejects.toThrow(
        /Direct UPI \/ Google Pay is not configured/i
      );
    });
  });

  describe('verifyPayment() - Security, Anti-Tampering & Idempotency', () => {
    it('should reject payment if order reference does not match (IDOR / Session Hijack)', async () => {
      const mockPayment: any = {
        amount: 2500,
        gatewayOrderId: 'OD-S4R-ORIGINAL',
      };

      const result = await gateway.verifyPayment(mockPayment, {
        gatewayOrderId: 'OD-S4R-ATTACKER-ORDER',
        paymentId: '123456789012',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('order reference mismatch');
    });

    it('should reject payment if paid amount differs from order amount (Amount Tampering)', async () => {
      const mockPayment: any = {
        amount: 10000,
        gatewayOrderId: 'OD-S4R-EXPENSIVE',
      };

      const result = await gateway.verifyPayment(mockPayment, {
        gatewayOrderId: 'OD-S4R-EXPENSIVE',
        amount: 10, // Tampered amount
        paymentId: '123456789012',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('amount does not match');
    });

    it('should successfully verify Google Pay tezResponse with status SUCCESS', async () => {
      const mockPayment: any = {
        amount: 1999,
        gatewayOrderId: 'OD-S4R-202611-002',
      };

      const tezResponse = JSON.stringify({
        Status: 'SUCCESS',
        responseCode: '00',
        txnId: 'UPI-GPAY-987654321',
        txnRef: 'OD-S4R-202611-002',
        ApprovalRefNo: 'APP12345',
      });

      const result = await gateway.verifyPayment(mockPayment, {
        gatewayOrderId: 'OD-S4R-202611-002',
        tezResponse,
        signature: 'valid_mock_signature_for_test_environment',
      });

      expect(result.success).toBe(true);
      expect(result.gatewayPaymentId).toBe('UPI-GPAY-987654321');
    });

    it('should reject Google Pay tezResponse if status is FAILED', async () => {
      const mockPayment: any = {
        amount: 1999,
        gatewayOrderId: 'OD-S4R-202611-002',
      };

      const tezResponse = JSON.stringify({
        Status: 'FAILURE',
        responseCode: 'U19',
        txnId: 'UPI-FAIL-111',
        txnRef: 'OD-S4R-202611-002',
      });

      const result = await gateway.verifyPayment(mockPayment, {
        gatewayOrderId: 'OD-S4R-202611-002',
        tezResponse,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('not approved by bank');
    });

    it('should reject duplicate UTR numbers to prevent replay attacks', async () => {
      const mockPayment: any = {
        _id: 'payment_id_2',
        amount: 3000,
        gatewayOrderId: 'OD-S4R-REPLAY',
      };

      // Mock finding an existing payment with this exact UTR on another order
      vi.mocked(PaymentRepository.findByGatewayOrderId).mockResolvedValue({
        _id: 'payment_id_1', // Different payment record!
        gatewayOrderId: '432109876543',
      } as any);

      const result = await gateway.verifyPayment(mockPayment, {
        gatewayOrderId: 'OD-S4R-REPLAY',
        utr: '432109876543',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('already been processed');
    });

    it('should accept valid unique 12-digit UTR', async () => {
      const mockPayment: any = {
        _id: 'payment_id_clean',
        amount: 3000,
        gatewayOrderId: 'OD-S4R-CLEAN',
      };

      vi.mocked(PaymentRepository.findByGatewayOrderId).mockResolvedValue(null);

      const result = await gateway.verifyPayment(mockPayment, {
        gatewayOrderId: 'OD-S4R-CLEAN',
        utr: '987654321012',
      });

      expect(result.success).toBe(true);
      expect(result.gatewayPaymentId).toBe('987654321012');
    });

    it('should accept Google Pay Web API test card suite paymentData (TEST mode)', async () => {
      const mockPayment: any = {
        _id: 'payment_id_gpay_test',
        amount: 4999,
        gatewayOrderId: 'OD-S4R-GPAY-TEST',
      };

      const mockGooglePayWebPaymentData = {
        apiVersion: 2,
        apiVersionMinor: 0,
        paymentMethodData: {
          description: 'Visa •••• 1111',
          info: {
            cardDetails: '1111',
            cardNetwork: 'VISA',
          },
          tokenizationData: {
            type: 'PAYMENT_GATEWAY',
            token: '{"signature": "test_sig", "intermediateSigningKey": {}}',
          },
          type: 'CARD',
        },
      };

      const result = await gateway.verifyPayment(mockPayment, {
        gatewayOrderId: 'OD-S4R-GPAY-TEST',
        paymentData: mockGooglePayWebPaymentData,
      });

      expect(result.success).toBe(true);
      expect(result.gatewayPaymentId).toContain('GPAY-WEB-VISA-1111');
      expect(result.message).toContain('Visa •••• 1111');
    });
  });
});
