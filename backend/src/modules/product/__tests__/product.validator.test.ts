import { describe, it, expect } from 'vitest';
import { ProductValidator } from '../product.validator';
import { NextRequest } from 'next/server';

describe('ProductValidator', () => {
  const createMockReq = (url: string) => {
    return {
      nextUrl: new URL(url),
    } as NextRequest;
  };

  it('should parse sort=bestselling correctly', () => {
    const req = createMockReq('http://localhost/api/products?sort=bestselling');
    const result = ProductValidator.validateListQuery(req);
    expect(result.sort).toEqual({ salesCount: -1, _id: -1 });
  });

  it('should parse sort=newest correctly', () => {
    const req = createMockReq('http://localhost/api/products?sort=newest');
    const result = ProductValidator.validateListQuery(req);
    expect(result.sort).toEqual({ createdAt: -1, _id: -1 });
  });

  it('should parse inStock correctly', () => {
    const req = createMockReq('http://localhost/api/products?inStock=true');
    const result = ProductValidator.validateListQuery(req);
    expect(result.filters).toHaveProperty('stockStatus');
    expect(result.filters.stockStatus).toEqual({ $gt: 0 });
  });
  
  it('should parse price range correctly', () => {
    const req = createMockReq('http://localhost/api/products?minPrice=500&maxPrice=1000');
    const result = ProductValidator.validateListQuery(req);
    expect(result.filters).toHaveProperty('$or');
    expect((result.filters as any).$or[0].basePrice).toEqual({ $gte: 500, $lte: 1000 });
  });
});
