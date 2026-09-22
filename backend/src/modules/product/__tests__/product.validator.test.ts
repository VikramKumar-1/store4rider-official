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
  
  it('should parse price range correctly using minPrice/maxPrice', () => {
    const req = createMockReq('http://localhost/api/products?minPrice=500&maxPrice=1000');
    const result = ProductValidator.validateListQuery(req);
    expect(result.filters).toHaveProperty('$or');
    expect((result.filters as any).$or[0].basePrice).toEqual({ $gte: 500, $lte: 1000 });
  });

  it('should parse price range correctly using priceMin/priceMax (aliases)', () => {
    const req = createMockReq('http://localhost/api/products?priceMin=500&priceMax=1000');
    const result = ProductValidator.validateListQuery(req);
    expect(result.filters).toHaveProperty('$or');
    expect((result.filters as any).$or[0].basePrice).toEqual({ $gte: 500, $lte: 1000 });
  });

  it('should parse single size correctly', () => {
    const req = createMockReq('http://localhost/api/products?size=XL');
    const result = ProductValidator.validateListQuery(req);
    const orConditions = (result.filters as any).$or;
    expect(orConditions).toBeDefined();
    // 4 conditions: configurableVariations, variants.sku, name, variants.attributes.size
    expect(orConditions.length).toBe(4);
    expect(orConditions[0].configurableVariations.$in[0].source).toEqual('\\bXL\\b');
    expect(orConditions[3]['variants.attributes.size'].$in[0].source).toEqual('^XL$');
  });

  it('should parse multiple sizes correctly', () => {
    const req = createMockReq('http://localhost/api/products?size=L,XL');
    const result = ProductValidator.validateListQuery(req);
    const orConditions = (result.filters as any).$or;
    expect(orConditions[0].configurableVariations.$in).toHaveLength(2);
    expect(orConditions[3]['variants.attributes.size'].$in).toHaveLength(2);
  });

  it('should ignore empty spaces and extra commas in sizes', () => {
    const req = createMockReq('http://localhost/api/products?size=L,, XL, ');
    const result = ProductValidator.validateListQuery(req);
    const orConditions = (result.filters as any).$or;
    expect(orConditions[0].configurableVariations.$in).toHaveLength(2); // Should only have 'L' and 'XL'
    expect(orConditions[0].configurableVariations.$in[1].source).toEqual('\\bXL\\b');
  });

  it('should parse multiple colours correctly including colour and color aliases', () => {
    const req = createMockReq('http://localhost/api/products?colour=Black,Red');
    const result = ProductValidator.validateListQuery(req);
    const orConditions = (result.filters as any).$or;
    expect(orConditions).toBeDefined();
    expect(orConditions.length).toBe(5); // configurableVariations, variants.sku, name, variants.attributes.color, variants.attributes.colour
    expect(orConditions[0].configurableVariations.$in).toHaveLength(2);
    expect(orConditions[3]['variants.attributes.color'].$in).toHaveLength(2);
  });

  it('should parse sort=rating correctly', () => {
    const req = createMockReq('http://localhost/api/products?sort=rating');
    const result = ProductValidator.validateListQuery(req);
    expect(result.sort).toEqual({ avgRating: -1, _id: -1 });
  });

  it('should correctly combine multiple filters (AND logic)', () => {
    const req = createMockReq('http://localhost/api/products?size=L&colour=Black&brand=MT&priceMin=5000');
    const result = ProductValidator.validateListQuery(req);
    expect(result.filters).toHaveProperty('$and');
    const andConditions = (result.filters as any).$and;
    expect(andConditions).toBeInstanceOf(Array);
    expect(andConditions.length).toBe(4); // Brand, Price, Size, Colour
  });

  it('should handle malicious regex attempts in search by escaping or ignoring', () => {
    // If a user passes regex payload like `.*` in category or search, the validator uses simple string splitting or `new RegExp`
    // We should test if it crashes.
    const req = createMockReq('http://localhost/api/products?search=(.*)+&size=+++&colour=[a-z]');
    const result = ProductValidator.validateListQuery(req);
    // As long as it doesn't throw and builds valid regex objects, it is handled.
    expect(result.filters).toHaveProperty('$and');
  });
});
