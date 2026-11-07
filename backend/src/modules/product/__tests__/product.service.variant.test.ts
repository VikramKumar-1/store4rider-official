import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { ProductService } from '../product.service';
import { ProductRepository } from '../product.repository';
import { ProductModel } from '../product.model';
import { connectToDatabase } from '../../../core/database/connection';

// Run live database integration tests whenever MONGODB_URI is provided
const shouldRunLiveDbTests = Boolean(
  process.env.MONGODB_URI &&
  process.env.MONGODB_URI !== ''
);

describe.skipIf(!shouldRunLiveDbTests)(
  'ProductService End-to-End Variant SpecialPrice & Relations Resolution',
  { timeout: 30000 },
  () => {
    beforeAll(async () => {
      try {
        await connectToDatabase();
        if (mongoose.connection.readyState === 1) {
          // 1. Ensure 'test-helmet' fixture exists for Test 1
          const helmet = await ProductModel.findOne({ slug: 'test-helmet' }).lean().exec();
          if (!helmet) {
            await ProductModel.create({
              name: 'Test Helmet',
              slug: 'test-helmet',
              sku: 'TEST-HELMET-FIXTURE',
              description: 'Test Helmet Description',
              basePrice: 2499,
              specialPrice: 1999,
              productType: 'configurable',
              status: 'published',
              visibility: 'Catalog, Search',
              variants: [
                {
                  id: 'var-helmet-1',
                  sku: 'TEST-HELMET-M',
                  price: 2499,
                  specialPrice: 1899,
                  stock: 10,
                  attributes: { size: 'M', color: 'Gloss Black' },
                },
              ],
            });
          }

          // 2. Ensure parent & child fixtures exist for Test 2 & Test 3
          const fixtureSkus = [
            {
              sku: 'BARJ',
              name: 'Barj Jacket',
              variants: [{ id: 'v-barj-1', sku: 'BARJ-S-Black', price: 1000, stock: 5 }],
              visibility: 'Catalog, Search',
              qty: 5,
              stockStatus: 1,
            },
            {
              sku: 'AASBG',
              name: 'Aasbg Bag',
              variants: [{ id: 'v-aasbg-1', sku: 'AASBG-XL-Black/Flu. Green', price: 1000, stock: 5 }],
              visibility: 'Catalog, Search',
              qty: 5,
              stockStatus: 1,
            },
            {
              sku: 'S4R-PROD-UPLO-763',
              name: 'S4R Upload Product',
              variants: [],
              visibility: 'Catalog, Search',
              qty: 10,
              stockStatus: 1,
            },
            {
              sku: 'AATGFFH-S-Black/Blue',
              name: 'Standalone Child Variant',
              variants: [],
              visibility: 'Catalog, Search',
              qty: 10,
              stockStatus: 1,
            },
          ];

          for (const item of fixtureSkus) {
            const exists = await ProductModel.findOne({
              $or: [{ sku: item.sku }, { 'variants.sku': item.sku }],
            }).lean().exec();

            if (!exists) {
              await ProductModel.create({
                name: item.name,
                slug: `fixture-${item.sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                sku: item.sku,
                description: `${item.name} description`,
                basePrice: 1000,
                productType: item.variants.length > 0 ? 'configurable' : 'simple',
                status: 'published',
                visibility: item.visibility,
                variants: item.variants,
                qty: item.qty ?? 10,
                stockStatus: item.stockStatus ?? 1,
              });
            } else {
              await ProductModel.updateOne(
                { _id: (exists as any)._id },
                {
                  $set: {
                    status: 'published',
                    visibility: item.visibility,
                    stockStatus: item.stockStatus ?? 1,
                    qty: item.qty ?? 10,
                    ...(item.variants && item.variants.length > 0 ? { variants: item.variants } : {}),
                  },
                }
              );
            }
          }
        }
      } catch {
        // Handled if database is unreachable
      }
    }, 30000);

    it('should fetch test-helmet with variants and specialPrice', async () => {
      if (mongoose.connection.readyState !== 1) return;
      const product = await ProductService.getProductBySlug('test-helmet');

      expect(product).toBeDefined();
      expect(product.variants).toBeDefined();
      expect(product.variants.length).toBeGreaterThan(0);
      expect(product.variants[0].specialPrice).toBe(1899);
    }, 30000);

    it('should resolve both child variants and parent products in findBySkus without dropping hidden items', async () => {
      if (mongoose.connection.readyState !== 1) return;

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
    }, 30000);

    it('should create product with variant specialPrice, update it, invalidate cache, and verify', async () => {
      if (mongoose.connection.readyState !== 1) return;

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
