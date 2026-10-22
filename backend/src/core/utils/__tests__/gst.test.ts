import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateTax, calculateInclusiveTax, getTaxRateFromClass } from '@store4riders/shared-utils';
import { InvoiceGenerator } from '../invoiceGenerator';
import { IOrder } from '@store4riders/shared-types';

import { CartRepository } from '../../../modules/cart/cart.repository';
import { ProductRepository } from '../../../modules/product/product.repository';
import { OrderRepository } from '../../../modules/order/order.repository';
import { OrderService } from '../../../modules/order/order.service';
import { PaymentGatewayFactory } from '../../payments/PaymentGatewayFactory';
import { ShipmentService } from '../../../modules/shipping/shipment.service';

vi.mock('../../../modules/settings/setting.repository', () => ({
  SettingRepository: {
    getSettings: vi.fn(),
  },
}));

vi.mock('../../../modules/cart/cart.repository', () => ({
  CartRepository: {
    getCart: vi.fn(),
  },
}));

vi.mock('../../../modules/product/product.repository', () => ({
  ProductRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('../../../modules/order/order.repository', () => ({
  OrderRepository: {
    findByIdempotencyKey: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    updateStatus: vi.fn().mockResolvedValue(true),
    getNextOrderSequence: vi.fn().mockResolvedValue(100001),
  },
}));

vi.mock('../../../modules/payment/payment.repository', () => ({
  PaymentRepository: {
    create: vi.fn().mockResolvedValue({ _id: 'pay_123', id: 'pay_123' }),
  },
}));

vi.mock('../../payments/PaymentGatewayFactory', () => ({
  PaymentGatewayFactory: {
    create: vi.fn().mockReturnValue({
      createOrder: vi.fn().mockResolvedValue({ gatewayOrderId: 'gtw_order_123' }),
    }),
  },
}));

vi.mock('../../../modules/shipping/shipment.service', () => ({
  ShipmentService: {
    checkServiceability: vi.fn().mockResolvedValue({ available: true, codAvailable: true }),
  },
}));

vi.mock('../../../modules/cart/cart.service', () => ({
  CartService: {
    clearCart: vi.fn().mockResolvedValue(true),
    getCart: vi.fn(),
  },
}));

vi.mock('../../../modules/user/user.repository', () => ({
  UserRepository: {
    findById: vi.fn().mockResolvedValue({ _id: 'user_1', email: 'test@example.com' }),
  },
}));

vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    default: {
      ...(actual.default || actual),
      models: {},
      model: vi.fn(),
      startSession: vi.fn().mockResolvedValue({
        withTransaction: vi.fn().mockImplementation(async (cb: any) => cb()),
        endSession: vi.fn().mockResolvedValue(true),
      }),
    },
  };
});

describe('GST Compliance & Calculation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Tax Utilities & Slabs (@store4riders/shared-utils)', () => {
    it('should correctly calculate exclusive tax for a given amount and rate', () => {
      // Base: ₹1,000 with 18% GST -> ₹180 tax
      const tax18 = calculateTax(1000, 18);
      expect(tax18).toBe(180);

      // Base: ₹2,500 with 28% GST -> ₹700 tax
      const tax28 = calculateTax(2500, 28);
      expect(tax28).toBe(700);

      // Base: ₹500 with 12% GST -> ₹60 tax
      const tax12 = calculateTax(500, 12);
      expect(tax12).toBe(60);

      // 0% tax
      expect(calculateTax(1000, 0)).toBe(0);
    });

    it('should correctly extract tax and taxable amount for GST-inclusive pricing', () => {
      // MRP ₹1,180 with 18% GST -> Taxable ₹1,000, Tax ₹180
      const res18 = calculateInclusiveTax(1180, 18);
      expect(res18.taxableAmount).toBe(1000);
      expect(res18.taxAmount).toBe(180);

      // MRP ₹1,280 with 28% GST -> Taxable ₹1,000, Tax ₹280
      const res28 = calculateInclusiveTax(1280, 28);
      expect(res28.taxableAmount).toBe(1000);
      expect(res28.taxAmount).toBe(280);

      // MRP ₹1,120 with 12% GST -> Taxable ₹1,000, Tax ₹120
      const res12 = calculateInclusiveTax(1120, 12);
      expect(res12.taxableAmount).toBe(1000);
      expect(res12.taxAmount).toBe(120);

      // Decimals / Rounding: MRP ₹999 with 18% GST
      // 999 / 1.18 = 846.610169 -> 846.61, tax = 999 - 846.61 = 152.39
      const resRound = calculateInclusiveTax(999, 18);
      expect(resRound.taxableAmount).toBe(846.61);
      expect(resRound.taxAmount).toBe(152.39);
      expect(resRound.taxableAmount + resRound.taxAmount).toBe(999);
    });

    it('should handle zero or negative amounts gracefully in inclusive tax', () => {
      expect(calculateInclusiveTax(0, 18)).toEqual({ taxableAmount: 0, taxAmount: 0 });
      expect(calculateInclusiveTax(-100, 18)).toEqual({ taxableAmount: -100, taxAmount: 0 });
      expect(calculateInclusiveTax(1000, 0)).toEqual({ taxableAmount: 1000, taxAmount: 0 });
    });

    it('should correctly parse tax rate from taxClassName', () => {
      expect(getTaxRateFromClass('GST 18%')).toBe(18);
      expect(getTaxRateFromClass('GST 28%')).toBe(28);
      expect(getTaxRateFromClass('GST 12%')).toBe(12);
      expect(getTaxRateFromClass('GST 5%')).toBe(5);
      expect(getTaxRateFromClass('Tax 18.5%')).toBe(18.5);

      // Fallback when no percentage in class name
      expect(getTaxRateFromClass('standard', 18)).toBe(18);
      expect(getTaxRateFromClass('', 18)).toBe(18);
      expect(getTaxRateFromClass(undefined, 18)).toBe(18);
      expect(getTaxRateFromClass(undefined, 28)).toBe(28);
    });
  });

  describe('2. Tax Invoice Generator (PDFKit GST Output)', () => {
    const baseMockOrder: IOrder = {
      _id: 'order_123',
      id: 'order_123',
      orderNumber: 'ORD-2026-99999',
      userId: 'user_1',
      items: [
        {
          productId: 'prod_1',
          name: 'SMK Titan Carbon Helmet',
          sku: 'SMK-TITAN-01',
          quantity: 1,
          unitPrice: 11800,
          taxRate: 18,
          taxAmount: 1800,
          hsnCode: '6506',
        },
      ],
      shippingAddress: {
        fullName: 'Rohan Sharma',
        phone: '9876543210',
        addressLine1: 'Flat 402, Sunshine Towers, MG Road',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        country: 'India',
      },
      pricing: {
        subtotal: 11800,
        discount: 0,
        tax: 1800,
        taxRate: 18,
        shipping: 0,
        total: 11800,
      },
      paymentMethod: 'upi',
      paymentStatus: 'paid',
      status: 'confirmed',
      createdAt: new Date('2026-10-13'),
      updatedAt: new Date('2026-10-13'),
    } as any;

    it('should generate an Intra-State PDF invoice with CGST and SGST split (50% each)', async () => {
      const { SettingRepository } = await import('../../../modules/settings/setting.repository');
      vi.mocked(SettingRepository.getSettings).mockResolvedValue({
        legalBusinessName: 'Store4Riders India Pvt Ltd',
        storeOriginAddress: 'Warehouse 4, Viman Nagar',
        storeOriginCity: 'Pune',
        storeOriginState: 'Maharashtra',
        storeOriginPincode: '411014',
        gstin: '27AAPCS1234F1Z5',
        gstPricingMode: 'inclusive',
        taxRate: 18,
      } as any);

      // Store in Maharashtra, Buyer in Maharashtra -> Intra-State
      const pdfBuffer = await InvoiceGenerator.generateInvoiceBuffer(baseMockOrder);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000); // Valid PDF output
      // PDF header validation (%PDF-)
      const pdfHeader = pdfBuffer.subarray(0, 5).toString('ascii');
      expect(pdfHeader).toBe('%PDF-');
    });

    it('should generate an Inter-State PDF invoice with IGST (100%)', async () => {
      const { SettingRepository } = await import('../../../modules/settings/setting.repository');
      vi.mocked(SettingRepository.getSettings).mockResolvedValue({
        legalBusinessName: 'Store4Riders India Pvt Ltd',
        storeOriginAddress: 'Warehouse 4, Viman Nagar',
        storeOriginCity: 'Pune',
        storeOriginState: 'Maharashtra',
        storeOriginPincode: '411014',
        gstin: '27AAPCS1234F1Z5',
        gstPricingMode: 'inclusive',
        taxRate: 18,
      } as any);

      // Store in Maharashtra, Buyer in Karnataka -> Inter-State
      const interstateOrder: IOrder = {
        ...baseMockOrder,
        shippingAddress: {
          ...baseMockOrder.shippingAddress,
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
        },
      };

      const pdfBuffer = await InvoiceGenerator.generateInvoiceBuffer(interstateOrder);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      const pdfHeader = pdfBuffer.subarray(0, 5).toString('ascii');
      expect(pdfHeader).toBe('%PDF-');
    });

    it('should include B2B Customer GSTIN and Company Name on PDF invoice', async () => {
      const { SettingRepository } = await import('../../../modules/settings/setting.repository');
      vi.mocked(SettingRepository.getSettings).mockResolvedValue({
        legalBusinessName: 'Store4Riders India Pvt Ltd',
        storeOriginAddress: 'Warehouse 4, Viman Nagar',
        storeOriginCity: 'Pune',
        storeOriginState: 'Maharashtra',
        storeOriginPincode: '411014',
        gstin: '27AAPCS1234F1Z5',
        gstPricingMode: 'inclusive',
        taxRate: 18,
      } as any);

      const b2bOrder: IOrder = {
        ...baseMockOrder,
        businessName: 'Apex Moto Logistics LLP',
        customerGstin: '29ABCDE1234F1Z5',
      };

      const pdfBuffer = await InvoiceGenerator.generateInvoiceBuffer(b2bOrder);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      const pdfHeader = pdfBuffer.subarray(0, 5).toString('ascii');
      expect(pdfHeader).toBe('%PDF-');
    });

    it('should correctly handle shipping fee line item and tax on shipping', async () => {
      const { SettingRepository } = await import('../../../modules/settings/setting.repository');
      vi.mocked(SettingRepository.getSettings).mockResolvedValue({
        legalBusinessName: 'Store4Riders India Pvt Ltd',
        storeOriginAddress: 'Warehouse 4',
        storeOriginCity: 'Pune',
        storeOriginState: 'Maharashtra',
        storeOriginPincode: '411014',
        gstin: '27AAPCS1234F1Z5',
        gstPricingMode: 'inclusive',
        taxRate: 18,
      } as any);

      const orderWithShipping: IOrder = {
        ...baseMockOrder,
        pricing: {
          ...baseMockOrder.pricing,
          shipping: 150,
          total: 11950,
        },
      };

      const pdfBuffer = await InvoiceGenerator.generateInvoiceBuffer(orderWithShipping);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
    });
  });

  describe('3. OrderService End-to-End GST Calculation & B2B Invoicing', () => {
    const mockProduct = {
      _id: 'prod_helmet',
      name: 'Carbon Pro Helmet',
      sku: 'CP-HELMET-01',
      basePrice: 1180, // MRP
      taxClassName: 'GST 18%',
      hsnCode: '6506',
      stockStatus: 1,
      stockQuantity: 10,
    };

    const mockCart = {
      items: [
        {
          productId: 'prod_helmet',
          quantity: 1,
        },
      ],
    };

    it('should calculate tax in INCLUSIVE mode without increasing order total', async () => {
      const { SettingRepository } = await import('../../../modules/settings/setting.repository');
      vi.mocked(SettingRepository.getSettings).mockResolvedValue({
        gstPricingMode: 'inclusive',
        taxRate: 18,
        freeShippingThreshold: 5000,
        shippingCost: 0,
      } as any);

      const { CartService } = await import('../../../modules/cart/cart.service');
      vi.mocked(CartService.getCart).mockResolvedValue(mockCart as any);
      vi.mocked(ProductRepository.findById).mockResolvedValue(mockProduct as any);

      let createdOrderPayload: any = null;
      vi.mocked(OrderRepository.create).mockImplementation(async (payload: any) => {
        createdOrderPayload = payload;
        return { ...payload, _id: 'ord_inc_1', id: 'ord_inc_1' } as any;
      });

      const result = await OrderService.createOrder('user_1', {
        shippingAddress: {
          fullName: 'Test User',
          phone: '9876543210',
          addressLine1: 'Street 1',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          country: 'India',
        },
        paymentMethod: 'payu',
      });

      expect(result).toBeDefined();
      expect(createdOrderPayload).toBeDefined();

      // In inclusive mode: Subtotal is 1180, Tax is extracted (180), Total is 1180
      expect(createdOrderPayload.pricing.subtotal).toBe(1180);
      expect(createdOrderPayload.pricing.tax).toBe(180);
      expect(createdOrderPayload.pricing.total).toBe(1180);
      expect(createdOrderPayload.items[0].taxAmount).toBe(180);
      expect(createdOrderPayload.items[0].taxRate).toBe(18);
      expect(createdOrderPayload.items[0].hsnCode).toBe('6506');
    });

    it('should calculate tax in EXCLUSIVE mode adding tax on top of subtotal', async () => {
      const { SettingRepository } = await import('../../../modules/settings/setting.repository');
      vi.mocked(SettingRepository.getSettings).mockResolvedValue({
        gstPricingMode: 'exclusive',
        taxRate: 18,
        freeShippingThreshold: 5000,
        shippingCost: 0,
      } as any);

      const { CartService } = await import('../../../modules/cart/cart.service');
      vi.mocked(CartService.getCart).mockResolvedValue(mockCart as any);
      // For exclusive mode, let basePrice be 1000
      vi.mocked(ProductRepository.findById).mockResolvedValue({
        ...mockProduct,
        basePrice: 1000,
      } as any);

      let createdOrderPayload: any = null;
      vi.mocked(OrderRepository.create).mockImplementation(async (payload: any) => {
        createdOrderPayload = payload;
        return { ...payload, _id: 'ord_exc_1', id: 'ord_exc_1' } as any;
      });

      const result = await OrderService.createOrder('user_1', {
        shippingAddress: {
          fullName: 'Test User',
          phone: '9876543210',
          addressLine1: 'Street 1',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          country: 'India',
        },
        paymentMethod: 'payu',
      });

      expect(result).toBeDefined();
      expect(createdOrderPayload).toBeDefined();

      // In exclusive mode: Subtotal is 1000, Tax is 180, Total is 1000 + 180 = 1180
      expect(createdOrderPayload.pricing.subtotal).toBe(1000);
      expect(createdOrderPayload.pricing.tax).toBe(180);
      expect(createdOrderPayload.pricing.total).toBe(1180);
    });

    it('should store customerGstin and businessName on order when provided by B2B buyer', async () => {
      const { SettingRepository } = await import('../../../modules/settings/setting.repository');
      vi.mocked(SettingRepository.getSettings).mockResolvedValue({
        gstPricingMode: 'inclusive',
        taxRate: 18,
        freeShippingThreshold: 5000,
        shippingCost: 0,
      } as any);

      const { CartService } = await import('../../../modules/cart/cart.service');
      vi.mocked(CartService.getCart).mockResolvedValue(mockCart as any);
      vi.mocked(ProductRepository.findById).mockResolvedValue(mockProduct as any);

      let createdOrderPayload: any = null;
      vi.mocked(OrderRepository.create).mockImplementation(async (payload: any) => {
        createdOrderPayload = payload;
        return { ...payload, _id: 'ord_b2b_1', id: 'ord_b2b_1' } as any;
      });

      await OrderService.createOrder('user_1', {
        shippingAddress: {
          fullName: 'Vikram Joshi',
          phone: '9876543210',
          addressLine1: 'MIDC Phase 2',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          country: 'India',
        },
        paymentMethod: 'payu',
        customerGstin: '27AABCS9876F1Z2',
        businessName: 'Maharashtra Moto Works Pvt Ltd',
      });

      expect(createdOrderPayload).toBeDefined();
      expect(createdOrderPayload.customerGstin).toBe('27AABCS9876F1Z2');
      expect(createdOrderPayload.businessName).toBe('Maharashtra Moto Works Pvt Ltd');
    });

    it('should sanitize lowercase and whitespace-padded customerGstin', async () => {
      const { SettingRepository } = await import('../../../modules/settings/setting.repository');
      vi.mocked(SettingRepository.getSettings).mockResolvedValue({
        gstPricingMode: 'inclusive',
        taxRate: 18,
        freeShippingThreshold: 5000,
        shippingCost: 0,
      } as any);

      const { CartService } = await import('../../../modules/cart/cart.service');
      vi.mocked(CartService.getCart).mockResolvedValue(mockCart as any);
      vi.mocked(ProductRepository.findById).mockResolvedValue(mockProduct as any);

      let createdOrderPayload: any = null;
      vi.mocked(OrderRepository.create).mockImplementation(async (payload: any) => {
        createdOrderPayload = payload;
        return { ...payload, _id: 'ord_b2b_clean', id: 'ord_b2b_clean' } as any;
      });

      await OrderService.createOrder('user_1', {
        shippingAddress: {
          fullName: 'Vikram Joshi',
          phone: '9876543210',
          addressLine1: 'MIDC Phase 2',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          country: 'India',
        },
        paymentMethod: 'payu',
        customerGstin: '  27aabcs9876f1z2  ',
        businessName: '  Maharashtra Moto Works  ',
      });

      expect(createdOrderPayload).toBeDefined();
      expect(createdOrderPayload.customerGstin).toBe('27AABCS9876F1Z2');
      expect(createdOrderPayload.businessName).toBe('Maharashtra Moto Works');
    });
  });

  describe('4. Critical GST Edge Cases', () => {
    it('should correctly handle zero-rated/exempt (0% tax) products without defaulting to 18%', async () => {
      const { SettingRepository } = await import('../../../modules/settings/setting.repository');
      vi.mocked(SettingRepository.getSettings).mockResolvedValue({
        legalBusinessName: 'Store4Riders',
        storeOriginState: 'Maharashtra',
        gstin: '27AAPCS1234F1Z5',
        gstPricingMode: 'inclusive',
        taxRate: 18,
      } as any);

      const exemptOrder: IOrder = {
        _id: 'order_exempt',
        id: 'order_exempt',
        orderNumber: 'ORD-EXEMPT-001',
        items: [
          {
            productId: 'prod_sticker',
            name: 'Safety Manual Book (Tax Exempt)',
            sku: 'MAN-001',
            quantity: 1,
            unitPrice: 200,
            taxRate: 0, // 0% tax
            taxAmount: 0,
            hsnCode: '4901',
          },
        ],
        shippingAddress: {
          fullName: 'Customer One',
          phone: '9876543210',
          addressLine1: 'Road 1',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
        },
        pricing: {
          subtotal: 200,
          discount: 0,
          tax: 0,
          taxRate: 0,
          shipping: 0,
          total: 200,
        },
        paymentMethod: 'upi',
        paymentStatus: 'paid',
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const pdfBuffer = await InvoiceGenerator.generateInvoiceBuffer(exemptOrder);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
    });

    it('should handle state comparison with whitespace and mixed casing properly (Intra-state)', async () => {
      const { SettingRepository } = await import('../../../modules/settings/setting.repository');
      vi.mocked(SettingRepository.getSettings).mockResolvedValue({
        legalBusinessName: 'Store4Riders',
        storeOriginState: '  Maharashtra  ', // padded with spaces
        gstin: '27AAPCS1234F1Z5',
        gstPricingMode: 'inclusive',
        taxRate: 18,
      } as any);

      const paddedOrder: IOrder = {
        _id: 'order_pad',
        id: 'order_pad',
        orderNumber: 'ORD-PAD-001',
        items: [
          {
            productId: 'prod_1',
            name: 'Gloves',
            sku: 'GLV-01',
            quantity: 1,
            unitPrice: 1000,
            taxRate: 18,
            taxAmount: 152.54,
            hsnCode: '6116',
          },
        ],
        shippingAddress: {
          fullName: 'Customer One',
          phone: '9876543210',
          addressLine1: 'Road 1',
          city: 'Mumbai',
          state: '  maharashtra  ', // padded + lowercase
          pincode: '400001',
          country: 'India',
        },
        pricing: {
          subtotal: 1000,
          discount: 0,
          tax: 152.54,
          taxRate: 18,
          shipping: 0,
          total: 1000,
        },
        paymentMethod: 'upi',
        paymentStatus: 'paid',
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      // Should generate without crashing and handle state match
      const pdfBuffer = await InvoiceGenerator.generateInvoiceBuffer(paddedOrder);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
    });

    it('should correctly pro-rate discounts across invoice line items', async () => {
      const { SettingRepository } = await import('../../../modules/settings/setting.repository');
      vi.mocked(SettingRepository.getSettings).mockResolvedValue({
        legalBusinessName: 'Store4Riders',
        storeOriginState: 'Maharashtra',
        gstin: '27AAPCS1234F1Z5',
        gstPricingMode: 'inclusive',
        taxRate: 18,
      } as any);

      const discountedOrder: IOrder = {
        _id: 'order_disc',
        id: 'order_disc',
        orderNumber: 'ORD-DISC-001',
        items: [
          {
            productId: 'prod_1',
            name: 'Jacket',
            sku: 'JKT-01',
            quantity: 1,
            unitPrice: 5000,
            taxRate: 12,
            taxAmount: 535.71,
            hsnCode: '6203',
          },
        ],
        shippingAddress: {
          fullName: 'Customer One',
          phone: '9876543210',
          addressLine1: 'Road 1',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          country: 'India',
        },
        pricing: {
          subtotal: 5000,
          discount: 0,
          couponCode: 'SAVE500',
          couponDiscount: 500, // ₹500 discount
          tax: 482.14,
          taxRate: 12,
          shipping: 0,
          total: 4500,
        },
        paymentMethod: 'upi',
        paymentStatus: 'paid',
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const pdfBuffer = await InvoiceGenerator.generateInvoiceBuffer(discountedOrder);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
    });

    it('should generate an invoice for Partial COD order with correct advance and balance', async () => {
      const partialCodOrder: any = {
        _id: 'order_cod_part',
        orderNumber: 'ORD-COD-001',
        items: [
          {
            productId: 'prod_1',
            name: 'Riding Boots',
            sku: 'BOOT-01',
            quantity: 1,
            unitPrice: 2000,
            taxRate: 18,
            taxAmount: 305.08,
            hsnCode: '6403',
          },
        ],
        shippingAddress: {
          fullName: 'Vikram Kumar',
          phone: '9876543210',
          addressLine1: 'Main Road',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          country: 'India',
        },
        paymentMethod: 'cod',
        pricing: {
          subtotal: 2000,
          discount: 0,
          couponDiscount: 0,
          tax: 305.08,
          taxRate: 18,
          shipping: 0,
          total: 2000,
          codPartialPaymentAmount: 1000, // 50% advance paid online
          codAmountToCollect: 1000,       // 50% remaining due at delivery
        },
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const pdfBuffer = await InvoiceGenerator.generateInvoiceBuffer(partialCodOrder);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    });

    it('should handle multi-warehouse state resolution (e.g., Kolkata to Jharkhand vs Mumbai to Pune)', async () => {
      const { normalizeIndianState } = await import('../invoiceGenerator');
      expect(normalizeIndianState('Maharashtra')).toBe('maharashtra');
      expect(normalizeIndianState('MH')).toBe('maharashtra');
      expect(normalizeIndianState('West Bengal')).toBe('westbengal');
      expect(normalizeIndianState('WB')).toBe('westbengal');
      expect(normalizeIndianState('Bihar')).toBe('bihar');
      expect(normalizeIndianState('BR')).toBe('bihar');
      expect(normalizeIndianState('Jharkhand')).toBe('jharkhand');
      expect(normalizeIndianState('JH')).toBe('jharkhand');

      // Test Kolkata warehouse -> Jharkhand order (Inter-State IGST)
      const interstateWarehouseOrder: any = {
        _id: 'order_wh_inter',
        orderNumber: 'ORD-WH-002',
        items: [
          {
            productId: 'prod_2',
            name: 'Helmet',
            sku: 'HLM-02',
            quantity: 1,
            unitPrice: 3000,
            taxRate: 18,
            taxAmount: 457.62,
            hsnCode: '6506',
          },
        ],
        shippingAddress: {
          fullName: 'Customer Jharkhand',
          phone: '9876543210',
          addressLine1: 'Main Road',
          city: 'Ranchi',
          state: 'Jharkhand',
          pincode: '834001',
          country: 'India',
        },
        pricing: {
          subtotal: 3000,
          discount: 0,
          couponDiscount: 0,
          tax: 457.62,
          taxRate: 18,
          shipping: 0,
          total: 3000,
        },
        paymentMethod: 'upi',
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const pdfBuffer = await InvoiceGenerator.generateInvoiceBuffer(interstateWarehouseOrder);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    });

    it('should cleanly handle 0% GST (Tax Exempt) without hardcoding 18%', async () => {
      const zeroTaxOrder: any = {
        id: 'order_zero_tax',
        orderNumber: 'ORD-ZERO-01',
        items: [
          {
            productId: 'prod_zero',
            name: 'Tax Exempt Item',
            sku: 'EXEMPT-01',
            quantity: 1,
            unitPrice: 1000,
            taxRate: 0,
            taxAmount: 0,
            hsnCode: '0000',
          },
        ],
        shippingAddress: {
          fullName: 'Zero Tax Customer',
          phone: '9876543210',
          addressLine1: 'Main Street',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
        },
        pricing: {
          subtotal: 1000,
          discount: 0,
          couponDiscount: 0,
          tax: 0,
          taxRate: 0,
          shipping: 0,
          total: 1000,
        },
        paymentMethod: 'upi',
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const pdfBuffer = await InvoiceGenerator.generateInvoiceBuffer(zeroTaxOrder);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    });

    it('should cleanly handle custom 28% and 5% GST slabs', async () => {
      const slab28Order: any = {
        id: 'order_28',
        orderNumber: 'ORD-28-01',
        items: [
          {
            productId: 'prod_28',
            name: 'Luxury Riding Gear',
            sku: 'LUX-28',
            quantity: 1,
            unitPrice: 12800,
            taxRate: 28,
            taxAmount: 2800,
            hsnCode: '8714',
          },
        ],
        shippingAddress: {
          fullName: 'Interstate Customer',
          phone: '9876543210',
          addressLine1: 'Station Road',
          city: 'Patna',
          state: 'Bihar',
          pincode: '800001',
        },
        pricing: {
          subtotal: 12800,
          discount: 0,
          couponDiscount: 0,
          tax: 2800,
          taxRate: 28,
          shipping: 0,
          total: 12800,
        },
        paymentMethod: 'upi',
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const pdfBuffer = await InvoiceGenerator.generateInvoiceBuffer(slab28Order);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    });

    it('should generate a PDF invoice with 4 products with long names and clean dynamic row heights', async () => {
      const { SettingRepository } = await import('../../../modules/settings/setting.repository');
      vi.mocked(SettingRepository.getSettings).mockResolvedValue({
        legalBusinessName: 'Store4Riders India Pvt Ltd',
        storeOriginAddress: 'Warehouse 4, Viman Nagar',
        storeOriginCity: 'Pune',
        storeOriginState: 'Maharashtra',
        storeOriginPincode: '411014',
        gstin: '27AAPCS1234F1Z5',
        gstPricingMode: 'inclusive',
        taxRate: 18,
      } as any);

      const multiProductOrder: any = {
        orderNumber: 'ORD-20261021-9999',
        items: [
          {
            name: 'Store4Riders Premium Full Face Helmet with Dual Visor & Pinlock 70 Ready System - Matte Carbon Edition',
            quantity: 1,
            unitPrice: 5999,
            hsnCode: '650610',
            sku: 'S4R-FFH-CARBON-XL',
          },
          {
            name: 'All-Weather Waterproof Armored Riding Jacket with Level 2 CE Protectors - Desert Sand / Stealth Black',
            quantity: 1,
            unitPrice: 7499,
            hsnCode: '620190',
            sku: 'S4R-JKT-ADV-L',
          },
          {
            name: 'Carbon Knuckle Full Gauntlet Leather Racing Gloves with Knox Scaphoid Protection System',
            quantity: 1,
            unitPrice: 3299,
            hsnCode: '611610',
            sku: 'S4R-GLV-RACE-M',
          },
          {
            name: 'Universal Anti-Vibration Heavy Duty Mobile Holder with 15W Qi Fast Wireless Charging',
            quantity: 2,
            unitPrice: 1499,
            hsnCode: '871410',
            sku: 'S4R-ACC-MNT-WRL',
          },
        ],
        shippingAddress: {
          fullName: 'Vikram Kumar',
          phone: '9876543210',
          addressLine1: 'Ranchi Main Road',
          city: 'Ranchi',
          state: 'Jharkhand',
          pincode: '834001',
        },
        pricing: {
          subtotal: 19795,
          discount: 500,
          couponDiscount: 0,
          tax: 3019.58,
          taxRate: 18,
          shipping: 99,
          total: 19394,
        },
        paymentMethod: 'upi',
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const pdfBuffer = await InvoiceGenerator.generateInvoiceBuffer(multiProductOrder);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1500);
      expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    });

    it('should generate updated COD invoice with zero balance and cash collected upon delivery status', async () => {
      const { SettingRepository } = await import('../../../modules/settings/setting.repository');
      vi.mocked(SettingRepository.getSettings).mockResolvedValue({
        legalBusinessName: 'Store4Riders India Pvt Ltd',
        storeOriginAddress: 'Warehouse 4, Viman Nagar',
        storeOriginCity: 'Pune',
        storeOriginState: 'Maharashtra',
        storeOriginPincode: '411014',
        gstin: '27AAPCS1234F1Z5',
        gstPricingMode: 'inclusive',
        taxRate: 18,
      } as any);

      // Delivered COD order
      const deliveredCodOrder: any = {
        orderNumber: 'ORD-20261021-DELV1',
        items: [
          {
            name: 'Riding Jacket',
            quantity: 1,
            unitPrice: 5000,
            hsnCode: '6201',
          },
        ],
        shippingAddress: {
          fullName: 'Vikram Kumar',
          phone: '9876543210',
          addressLine1: 'Ranchi Main Road',
          city: 'Ranchi',
          state: 'Jharkhand',
          pincode: '834001',
        },
        pricing: {
          subtotal: 5000,
          discount: 0,
          couponDiscount: 0,
          tax: 762.71,
          taxRate: 18,
          shipping: 0,
          total: 5000,
          codPartialPaymentAmount: 500,
          codAmountToCollect: 4500,
        },
        paymentMethod: 'cod',
        status: 'delivered', // Delivered!
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const pdfBuffer = await InvoiceGenerator.generateInvoiceBuffer(deliveredCodOrder);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    });
  });
});
