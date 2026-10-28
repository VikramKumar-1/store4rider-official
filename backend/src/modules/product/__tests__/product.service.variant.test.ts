import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { ProductService } from '../product.service';
import { ProductRepository } from '../product.repository';
import { connectToDatabase } from '../../../core/database/connection';

describe('ProductService End-to-End Variant SpecialPrice & Relations Resolution', () => {
  it('should fetch test-helmet with variants and specialPrice', async () => {
    await connectToDatabase();
    const product = await ProductService.getProductBySlug('test-helmet');

    expect(product).toBeDefined();
    expect(product.variants).toBeDefined();
    expect(product.variants.length).toBeGreaterThan(0);
    expect(product.variants[0].specialPrice).toBe(1899);
  });

  it('should resolve both child variants and parent products in findBySkus without dropping hidden items', async () => {
    await connectToDatabase();

    const skus = ['AATGFFH-S-Black/Blue', 'BARJ-S-Black', 'S4R-PROD-UPLO-763', 'AASBG-XL-Black/Flu. Green'];
    const resolved = await ProductRepository.findBySkus(skus);

    expect(resolved.length).toBe(4);
    
    const resolvedSkus = resolved.map((p) => p.sku);
    // Should resolve child variants to parents where parents exist:
    expect(resolvedSkus).toContain('BARJ');
    expect(resolvedSkus).toContain('AASBG');
    expect(resolvedSkus).toContain('S4R-PROD-UPLO-763');
    // Standalone child variant without parent in catalog is preserved:
    expect(resolvedSkus).toContain('AATGFFH-S-Black/Blue');
  });

  it('should create product with variant specialPrice, update it, invalidate cache, and verify', async () => {
    await connectToDatabase();

    const uniqueSuffix = Date.now();
    const testSku = `TEST-E2E-VAR-${uniqueSuffix}`;
    const testSlug = `test-e2e-var-${uniqueSuffix}`;

    // 1. Create Product with variant specialPrice
    const created = await ProductService.createProduct({
      name: `Test E2E Product ${uniqueSuffix}`,
      sku: testSku,
      slug: testSlug,
      description: "Test E2E Product Description",
      basePrice: 5000,
      specialPrice: 4500,
      productType: "configurable",
      status: "published",
      visibility: "Catalog, Search",
      countryOfManufacture: "India",
      variants: [
        {
          id: `var-1-${uniqueSuffix}`,
          sku: `${testSku}-M`,
          price: 5000,
          specialPrice: 4200,
          stock: 15,
          attributes: { size: "M", color: "Matte Black" },
        },
        {
          id: `var-2-${uniqueSuffix}`,
          sku: `${testSku}-L`,
          price: 5000,
          specialPrice: 4100,
          stock: 20,
          attributes: { size: "L", color: "Matte Black" },
        },
      ],
      relatedSkus: ['AASBG-XL-Black/Flu. Green'],
      upsellSkus: ['AATGFFH-S-Black/Blue'],
    } as any);

    expect(created).toBeDefined();
    expect(created.variants[0].specialPrice).toBe(4200);
    expect(created.variants[1].specialPrice).toBe(4100);

    // 2. Fetch via getProductBySlug (should populate cache)
    const fetched1 = await ProductService.getProductBySlug(testSlug);
    expect(fetched1.variants[0].specialPrice).toBe(4200);

    // 3. Update variant specialPrice
    const updated = await ProductService.updateProduct(String((created as any)._id), {
      variants: [
        {
          id: `var-1-${uniqueSuffix}`,
          sku: `${testSku}-M`,
          price: 5000,
          specialPrice: 3899, // Updated specialPrice
          stock: 15,
          attributes: { size: "M", color: "Matte Black" },
        },
        {
          id: `var-2-${uniqueSuffix}`,
          sku: `${testSku}-L`,
          price: 5000,
          specialPrice: 3799, // Updated specialPrice
          stock: 20,
          attributes: { size: "L", color: "Matte Black" },
        },
      ],
    });

    expect(updated.variants[0].specialPrice).toBe(3899);

    // 4. Fetch again via getProductBySlug (cache should be invalidated and return fresh 3899)
    const fetched2 = await ProductService.getProductBySlug(testSlug);
    expect(fetched2.variants[0].specialPrice).toBe(3899);
    expect(fetched2.variants[1].specialPrice).toBe(3799);

    // 5. Test recommendations
    const kit = await ProductService.getKitRecommendations(testSlug);
    expect(kit.length).toBeGreaterThan(0);
    expect(kit[0].sku).toBe('AASBG');

    const upsells = await ProductService.getUpsellRecommendations(testSlug);
    expect(upsells.length).toBeGreaterThan(0);
    expect(upsells[0].sku).toBe('AATGFFH-S-Black/Blue');

    // 6. Clean up test product
    await ProductService.deleteProduct(String((created as any)._id));
  }, 30000);
});
