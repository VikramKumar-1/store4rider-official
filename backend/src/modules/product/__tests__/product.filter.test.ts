import { describe, it, expect } from 'vitest';
import { ProductValidator } from '../product.validator';
import { NextRequest } from 'next/server';

describe('Product Filter & Query Validation Suite', () => {
  const createMockReq = (url: string) => {
    return {
      nextUrl: new URL(url),
    } as NextRequest;
  };

  describe('1. Category Filtering & Mapping', () => {
    it('should correctly build query for singular category (e.g. helmet)', () => {
      const req = createMockReq('http://localhost/api/products?category=helmet');
      const result = ProductValidator.validateListQuery(req);
      
      expect(result.filters).toBeDefined();
      const andConditions = (result.filters as any).$and;
      expect(Array.isArray(andConditions)).toBe(true);

      const hasCategoryMatch = andConditions.some((cond: any) => {
        if (cond.categorySlugs?.$in) {
          return cond.categorySlugs.$in.includes('helmet') && cond.categorySlugs.$in.includes('helmets');
        }
        if (cond.$or) {
          return cond.$or.some((sub: any) => sub.categorySlugs?.$in?.includes('helmet'));
        }
        return false;
      });
      expect(hasCategoryMatch).toBe(true);
    });

    it('should correctly build query for plural category (e.g. motorcycle-helmets)', () => {
      const req = createMockReq('http://localhost/api/products?category=motorcycle-helmets');
      const result = ProductValidator.validateListQuery(req);
      
      const andConditions = (result.filters as any).$and;
      expect(Array.isArray(andConditions)).toBe(true);

      const hasCategoryMatch = andConditions.some((cond: any) => {
        if (cond.categorySlugs?.$in) {
          return cond.categorySlugs.$in.includes('motorcycle-helmets');
        }
        if (cond.$or) {
          return cond.$or.some((sub: any) => sub.categorySlugs?.$in?.includes('motorcycle-helmets'));
        }
        return false;
      });
      expect(hasCategoryMatch).toBe(true);
    });

    it('should handle nested path categories (e.g. riding-gear/riding-jacket)', () => {
      const req = createMockReq('http://localhost/api/products?category=riding-gear/riding-jacket');
      const result = ProductValidator.validateListQuery(req);
      
      const andConditions = (result.filters as any).$and;
      const hasJacketMatch = andConditions.some((cond: any) => {
        if (cond.categorySlugs?.$in) {
          return cond.categorySlugs.$in.includes('riding-jacket');
        }
        if (cond.$or) {
          return cond.$or.some((sub: any) => sub.categorySlugs?.$in?.includes('riding-jacket'));
        }
        return false;
      });
      expect(hasJacketMatch).toBe(true);
    });
  });

  describe('2. Brand Filtering', () => {
    it('should filter by single brand (e.g. brand=axor)', () => {
      const req = createMockReq('http://localhost/api/products?brand=axor');
      const result = ProductValidator.validateListQuery(req);
      
      const andConditions = (result.filters as any).$and;
      const hasBrandCondition = andConditions.some((cond: any) => {
        return cond.$or && cond.$or.some((sub: any) => sub.brand || sub.name);
      });
      expect(hasBrandCondition).toBe(true);
    });

    it('should filter by multiple brands comma-separated (e.g. brand=axor,smk,ls2)', () => {
      const req = createMockReq('http://localhost/api/products?brand=axor,smk,ls2');
      const result = ProductValidator.validateListQuery(req);
      
      const andConditions = (result.filters as any).$and;
      // Multiple brands are nested inside an $or containing each brand's match condition
      const multiBrandCond = andConditions.find((cond: any) => cond.$or && cond.$or.length === 3);
      expect(multiBrandCond).toBeDefined();
      expect(multiBrandCond.$or.length).toBe(3);
    });
  });

  describe('3. Price Range Filtering', () => {
    it('should filter with both minPrice and maxPrice (e.g. ₹3,000 - ₹6,000)', () => {
      const req = createMockReq('http://localhost/api/products?minPrice=3000&maxPrice=6000');
      const result = ProductValidator.validateListQuery(req);
      
      const andConditions = (result.filters as any).$and;
      const priceCond = andConditions.find((cond: any) => cond.$or && cond.$or[0]?.specialPrice?.$gte === 3000);
      expect(priceCond).toBeDefined();
      expect(priceCond.$or[0].specialPrice).toEqual({ $gte: 3000, $lte: 6000, $gt: 0 });
      expect(priceCond.$or[1].basePrice).toEqual({ $gte: 3000, $lte: 6000, $gt: 0 });
    });

    it('should filter with only minPrice (e.g. > ₹10,000)', () => {
      const req = createMockReq('http://localhost/api/products?minPrice=10000');
      const result = ProductValidator.validateListQuery(req);
      
      const andConditions = (result.filters as any).$and;
      const priceCond = andConditions.find((cond: any) => cond.$or && cond.$or[0]?.specialPrice?.$gte === 10000);
      expect(priceCond).toBeDefined();
      expect(priceCond.$or[1].basePrice.$gte).toBe(10000);
    });

    it('should filter with only maxPrice (e.g. < ₹3,000)', () => {
      const req = createMockReq('http://localhost/api/products?maxPrice=3000');
      const result = ProductValidator.validateListQuery(req);
      
      const andConditions = (result.filters as any).$and;
      const priceCond = andConditions.find((cond: any) => cond.$or && cond.$or[0]?.specialPrice?.$lte === 3000);
      expect(priceCond).toBeDefined();
      expect(priceCond.$or[1].basePrice.$lte).toBe(3000);
    });
  });

  describe('4. Filter Combinations (Category + Brand + Price + InStock + Sort)', () => {
    it('should correctly combine Category + Brand + Price together without collisions', () => {
      const req = createMockReq('http://localhost/api/products?category=helmets&brand=axor&minPrice=2000&maxPrice=8000&inStock=true&sort=price-asc');
      const result = ProductValidator.validateListQuery(req);
      
      // 1. Pagination & Sort
      expect(result.page).toBe(1);
      expect(result.limit).toBe(12);
      expect(result.sort).toEqual({ basePrice: 1, _id: -1 });

      // 2. Status guard
      expect(result.filters.status).toEqual({ $nin: ['draft', 'archived'] });
      expect(result.filters.visibility).toEqual({ $nin: ['1', 'Not Visible Individually'] });

      // 3. $and conditions containing Category, Brand, Price, and inStock
      const andConditions = (result.filters as any).$and;
      expect(andConditions).toBeDefined();
      expect(andConditions.length).toBeGreaterThanOrEqual(4);

      // Verify InStock condition exists
      const hasInStock = andConditions.some((cond: any) => cond.$or && cond.$or.some((s: any) => s.stockStatus?.$gt === 0));
      expect(hasInStock).toBe(true);

      // Verify Price condition exists
      const hasPrice = andConditions.some((cond: any) => cond.$or && cond.$or[0]?.specialPrice?.$gte === 2000);
      expect(hasPrice).toBe(true);
    });

    it('should enforce status not draft or archived by default', () => {
      const req = createMockReq('http://localhost/api/products');
      const result = ProductValidator.validateListQuery(req);
      
      expect(result.filters.status).toEqual({ $nin: ['draft', 'archived'] });
      expect(result.filters.visibility).toEqual({ $nin: ['1', 'Not Visible Individually'] });
    });
  });

  describe('5. Sorting Variations', () => {
    it('should parse sort=price-desc correctly', () => {
      const req = createMockReq('http://localhost/api/products?sort=price-desc');
      const result = ProductValidator.validateListQuery(req);
      expect(result.sort).toEqual({ basePrice: -1, _id: -1 });
    });

    it('should parse sort=rating correctly', () => {
      const req = createMockReq('http://localhost/api/products?sort=rating');
      const result = ProductValidator.validateListQuery(req);
      expect(result.sort).toEqual({ avgRating: -1, _id: -1 });
    });

    it('should default sort to featured/newest when not provided', () => {
      const req = createMockReq('http://localhost/api/products');
      const result = ProductValidator.validateListQuery(req);
      expect(result.sort).toEqual({ isFeatured: -1, createdAt: -1, _id: -1 });
    });
  });
});
