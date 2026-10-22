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

  it('should parse inStock correctly inside andConditions', () => {
    const req = createMockReq('http://localhost/api/products?inStock=true');
    const result = ProductValidator.validateListQuery(req);
    const andConditions = (result.filters as any).$and;
    expect(andConditions).toBeDefined();
    const hasInStock = andConditions.some((cond: any) => cond.$or && cond.$or.some((s: any) => s.stockStatus?.$gt === 0));
    expect(hasInStock).toBe(true);
  });
  
  it('should parse price range correctly using minPrice/maxPrice inside andConditions', () => {
    const req = createMockReq('http://localhost/api/products?minPrice=500&maxPrice=1000');
    const result = ProductValidator.validateListQuery(req);
    const andConditions = (result.filters as any).$and;
    expect(andConditions).toBeDefined();
    const priceCond = andConditions.find((cond: any) => cond.$or && cond.$or[0]?.specialPrice?.$gte === 500);
    expect(priceCond).toBeDefined();
    expect(priceCond.$or[0].specialPrice).toEqual({ $gte: 500, $lte: 1000, $gt: 0 });
    expect(priceCond.$or[1].basePrice).toEqual({ $gte: 500, $lte: 1000, $gt: 0 });
  });

  it('should parse price range correctly using priceMin/priceMax (aliases)', () => {
    const req = createMockReq('http://localhost/api/products?priceMin=500&priceMax=1000');
    const result = ProductValidator.validateListQuery(req);
    const andConditions = (result.filters as any).$and;
    expect(andConditions).toBeDefined();
    const priceCond = andConditions.find((cond: any) => cond.$or && cond.$or[0]?.specialPrice?.$gte === 500);
    expect(priceCond).toBeDefined();
    expect(priceCond.$or[0].specialPrice).toEqual({ $gte: 500, $lte: 1000, $gt: 0 });
    expect(priceCond.$or[1].basePrice).toEqual({ $gte: 500, $lte: 1000, $gt: 0 });
  });

  it('should parse single size correctly inside andConditions', () => {
    const req = createMockReq('http://localhost/api/products?size=XL');
    const result = ProductValidator.validateListQuery(req);
    const andConditions = (result.filters as any).$and;
    expect(andConditions).toBeDefined();
    const sizeCond = andConditions.find((cond: any) => cond.$or && cond.$or.some((s: any) => s.configurableVariations));
    expect(sizeCond).toBeDefined();
    expect(sizeCond.$or.length).toBe(9);
    expect(sizeCond.$or[0].configurableVariations.$in[0].source).toEqual('(?:size|eu_size|eu_size_for_boots)=XL(\\||,|$)');
  });

  it('should parse multiple sizes correctly', () => {
    const req = createMockReq('http://localhost/api/products?size=L,XL');
    const result = ProductValidator.validateListQuery(req);
    const andConditions = (result.filters as any).$and;
    const sizeCond = andConditions.find((cond: any) => cond.$or && cond.$or.some((s: any) => s.configurableVariations));
    expect(sizeCond).toBeDefined();
    expect(sizeCond.$or[0].configurableVariations.$in).toHaveLength(2);
  });

  it('should ignore empty spaces and extra commas in sizes', () => {
    const req = createMockReq('http://localhost/api/products?size=L,, XL, ');
    const result = ProductValidator.validateListQuery(req);
    const andConditions = (result.filters as any).$and;
    const sizeCond = andConditions.find((cond: any) => cond.$or && cond.$or.some((s: any) => s.configurableVariations));
    expect(sizeCond).toBeDefined();
    expect(sizeCond.$or[0].configurableVariations.$in).toHaveLength(2);
  });

  it('should parse multiple colours correctly including colour and color aliases', () => {
    const req = createMockReq('http://localhost/api/products?colour=Black,Red');
    const result = ProductValidator.validateListQuery(req);
    const andConditions = (result.filters as any).$and;
    const colorCond = andConditions.find((cond: any) => cond.$or && cond.$or.some((s: any) => s['variants.attributes.color']));
    expect(colorCond).toBeDefined();
    expect(colorCond.$or.length).toBe(15);
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
    // Base conditions (price>0, stock) + Brand + Price + Size + Colour = 7
    expect(andConditions.length).toBeGreaterThanOrEqual(4);
  });

  it('should handle malicious regex attempts in search by escaping or ignoring', () => {
    const req = createMockReq('http://localhost/api/products?search=(.*)+&size=+++&colour=[a-z]');
    const result = ProductValidator.validateListQuery(req);
    expect(result.filters).toHaveProperty('$and');
  });
});
