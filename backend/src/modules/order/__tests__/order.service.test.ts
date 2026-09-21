import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { OrderService } from '../order.service';
import { OrderRepository } from '../order.repository';
import { ProductRepository } from '../../product/product.repository';

vi.mock('../order.repository');
vi.mock('../../product/product.repository');
vi.mock('crypto', () => ({
  default: {
    createHmac: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('dummy_signature')
    })
  }
}));
// Need to mock ENV for webhook secret
vi.mock('../../../core/config/env', () => ({
  ENV: {
    RAZORPAY_WEBHOOK_SECRET: 'test_secret',
    RAZORPAY_KEY_ID: 'test_key',
    RAZORPAY_KEY_SECRET: 'test_secret'
  }
}));
vi.mock('../../user/user.repository', () => ({
  UserRepository: {
    findById: vi.fn().mockResolvedValue(null)
  }
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
        endSession: vi.fn().mockResolvedValue(true)
      })
    }
  };
});

describe('OrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handleWebhook should update order status, decrement stock, and increment salesCount on payment.captured', async () => {
    const mockOrder = {
      _id: 'order123',
      status: 'created',
      items: [
        { productId: 'prod1', quantity: 2 },
        { productId: 'prod2', quantity: 1 }
      ]
    };

    vi.mocked(OrderRepository.findByRazorpayOrderId).mockResolvedValue(mockOrder as any);
    vi.mocked(OrderRepository.updateStatus).mockResolvedValue(mockOrder as any);
    vi.mocked(ProductRepository.decrementStock).mockResolvedValue(true as any);
    vi.mocked(ProductRepository.incrementSalesCount).mockResolvedValue(true as any);

    const event = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_123',
            order_id: 'order_123',
            status: 'captured'
          }
        }
      }
    };

    const signature = 'dummy_signature';
    const rawBody = JSON.stringify(event);

    await OrderService.handleWebhook(rawBody, signature);

    // Verify order status updated to paid
    expect(OrderRepository.updateStatus).toHaveBeenCalledWith('order123', 'paid', expect.any(Object), expect.any(Object));

    // Verify stock and salesCount
    expect(ProductRepository.decrementStock).toHaveBeenCalledWith('prod1', 2, expect.any(Object));
    expect(ProductRepository.incrementSalesCount).toHaveBeenCalledWith('prod1', 2, expect.any(Object));
    
    expect(ProductRepository.decrementStock).toHaveBeenCalledWith('prod2', 1, expect.any(Object));
    expect(ProductRepository.incrementSalesCount).toHaveBeenCalledWith('prod2', 1, expect.any(Object));
  });
});
