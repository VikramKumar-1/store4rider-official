import { CouponRepository } from "./coupon.repository";
import { ICoupon, ICouponValidationResult } from "@store4riders/shared-types";
import { AppError, NotFoundError } from "../../core/errors/AppError";
import { OrderRepository } from "../order/order.repository";
import { ProductRepository } from "../product/product.repository";
import mongoose, { ClientSession } from "mongoose";
import {
  CATEGORY_ALIAS_MAP,
  LEAF_TO_PARENT_MAP,
  resolveCanonicalCategorySlugs,
} from "../product/product.category-constants";

export interface IValidateCouponInput {
  code: string;
  items?: Array<{
    productId: string;
    variantId?: string | null;
    quantity: number;
  }>;
  cartTotal?: number;
  userId?: string;
  guestEmail?: string;
}

/**
 * @class CouponService
 * @description Enterprise business logic for discount coupons and promotions.
 * Highlights:
 * - Start date and Expiry date enforcement.
 * - Global total redemptions cap & per-user usage limits.
 * - First-time customer verification via order history.
 * - Catalog offer (specialPrice) interaction & excludeSaleItems protection.
 * - Scope targeting: Storewide, Brand-specific, Category-specific, Product-specific.
 * - Max discount caps and zero-price / negative-price floor guards.
 */
export class CouponService {
  static async validateCoupon(input: IValidateCouponInput): Promise<ICouponValidationResult> {
    const { code, items, cartTotal, userId } = input;

    // Strict Industry Standard: Promo coupons are strictly for authenticated, registered customers
    if (!userId) {
      throw new AppError("Please sign in or create an account to apply promo coupons", 401);
    }

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      throw new AppError("Coupon code is required", 400);
    }

    const cleanCode = code.toUpperCase().trim();
    const coupon = await CouponRepository.findByCode(cleanCode);

    if (!coupon) {
      throw new NotFoundError("Coupon code not found");
    }

    if (!coupon.isActive) {
      throw new AppError("Coupon is currently inactive", 400);
    }

    const now = new Date();

    // 1. Start Date Check
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      throw new AppError("This coupon is not active yet", 400);
    }

    // 2. Expiry Date Check
    if (new Date(coupon.expiryDate) < now) {
      throw new AppError("This coupon has expired", 400);
    }

    // 3. Global Total Usage Limit Check
    if (typeof coupon.totalUsageLimit === "number" && coupon.totalUsageLimit > 0) {
      if ((coupon.usageCount || 0) >= coupon.totalUsageLimit) {
        throw new AppError("This coupon has reached its maximum total redemptions limit", 400);
      }
    }

    // 4. Per-User Usage Limit Check (Strict User Identity)
    const effectiveLimit = coupon.usageLimitPerUser || 1;
    const userUsage = await OrderRepository.countUserCouponUsage(cleanCode, userId);
    if (userUsage >= effectiveLimit) {
      throw new AppError(
        `You have already used this coupon the maximum allowed number of times (${effectiveLimit})`,
        400
      );
    }

    // 5. First Order Only Check (Strict User Identity)
    if (coupon.firstOrderOnly) {
      const pastOrders = await OrderRepository.countUserOrders(userId);
      if (pastOrders > 0) {
        throw new AppError("This coupon is valid only on your first purchase", 400);
      }
    }

    // 6. Item Qualification & Scope Filtering
    let eligibleSubtotal = 0;
    let anySaleItemExcluded = false;

    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const product = await ProductRepository.findById(item.productId);
        if (!product) continue;

        // Determine effective unit price from DB (Zero-Trust on client)
        let unitPrice = product.basePrice;
        let isItemOnSale = false;

        if (product.specialPrice && product.specialPrice > 0 && product.specialPrice < product.basePrice) {
          const fromDate = product.specialPriceFromDate ? new Date(product.specialPriceFromDate) : null;
          const toDate = product.specialPriceToDate ? new Date(product.specialPriceToDate) : null;
          const isStarted = fromDate ? now >= fromDate : true;
          const isNotExpired = toDate ? now <= toDate : true;

          if (isStarted && isNotExpired) {
            unitPrice = product.specialPrice;
            isItemOnSale = true;
          }
        }

        if (item.variantId && Array.isArray(product.variants)) {
          const variant = product.variants.find(
            (v: any) => v.id === item.variantId || v.sku === item.variantId || String((v as any)._id) === item.variantId
          );
          if (variant) {
            if (variant.specialPrice && variant.specialPrice > 0 && variant.specialPrice < variant.price) {
              unitPrice = variant.specialPrice;
              isItemOnSale = true;
            } else {
              unitPrice = variant.price;
            }
          }
        }

        // Check excludeSaleItems guardrail
        if (coupon.excludeSaleItems && isItemOnSale) {
          anySaleItemExcluded = true;
          continue; // Skip this item from coupon discount calculation
        }

        // Scope Matching
        let isEligible = true;

        if (coupon.scope === "brand") {
          const brandList = (coupon.applicableBrands || []).map((b) => b.trim().toLowerCase());
          const productBrand = (product.brand || "").trim().toLowerCase();
          if (!brandList.includes(productBrand)) {
            isEligible = false;
          }
        } else if (coupon.scope === "category") {
          // 1. Build comprehensive set of target category identifiers for the coupon
          const targetCategories = new Set<string>();
          for (const rawCat of coupon.applicableCategories || []) {
            if (!rawCat) continue;
            const clean = rawCat.trim().toLowerCase();
            targetCategories.add(clean);
            targetCategories.add(clean.replace(/[^a-z0-9]+/g, "-"));
            targetCategories.add(clean.replace(/[-_]+/g, " "));

            // Include aliases from CATEGORY_ALIAS_MAP
            const aliases = CATEGORY_ALIAS_MAP[clean] || [];
            aliases.forEach((a) => {
              targetCategories.add(a.toLowerCase());
              targetCategories.add(a.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
            });

            // If target is a parent category (e.g. "motorcycle-helmets" or "riding-gear"),
            // also allow any leaf category whose parent maps to this category
            for (const [leafSlug, parentSlug] of Object.entries(LEAF_TO_PARENT_MAP)) {
              if (
                parentSlug.toLowerCase() === clean ||
                parentSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-") === clean
              ) {
                targetCategories.add(leafSlug.toLowerCase());
              }
            }
          }

          // 2. Build comprehensive set of product category identifiers
          const productCategories = new Set<string>();

          // Primary category ID or slug
          if (product.categoryId) {
            const catIdClean = String(product.categoryId).trim().toLowerCase();
            productCategories.add(catIdClean);
            productCategories.add(catIdClean.replace(/[^a-z0-9]+/g, "-"));
            if (LEAF_TO_PARENT_MAP[catIdClean]) {
              productCategories.add(LEAF_TO_PARENT_MAP[catIdClean].toLowerCase());
            }
          }

          // Attached category slugs
          if (Array.isArray(product.categorySlugs)) {
            for (const s of product.categorySlugs) {
              if (s) {
                const sClean = String(s).trim().toLowerCase();
                productCategories.add(sClean);
                productCategories.add(sClean.replace(/[^a-z0-9]+/g, "-"));
                if (LEAF_TO_PARENT_MAP[sClean]) {
                  productCategories.add(LEAF_TO_PARENT_MAP[sClean].toLowerCase());
                }
              }
            }
          }

          // Canonical category slugs with leaf-to-parent propagation
          try {
            const canonicalSlugs = resolveCanonicalCategorySlugs(product as any);
            for (const c of canonicalSlugs) {
              const cLower = c.toLowerCase();
              productCategories.add(cLower);
              if (LEAF_TO_PARENT_MAP[cLower]) {
                productCategories.add(LEAF_TO_PARENT_MAP[cLower].toLowerCase());
              }
            }
          } catch {}

          // Legacy Magento category paths
          if (product.magentoCategories && typeof product.magentoCategories === "string") {
            const rawMag = product.magentoCategories.toLowerCase();
            productCategories.add(rawMag);
            const pathParts = rawMag.split(/[,/]/).map((p) => p.trim()).filter(Boolean);
            for (const p of pathParts) {
              productCategories.add(p);
              productCategories.add(p.replace(/[^a-z0-9]+/g, "-"));
            }
          }

          // DB lookup if product.categoryId is a valid ObjectId
          if (product.categoryId && mongoose.isValidObjectId(product.categoryId)) {
            try {
              const { CategoryModel } = await import("../category/category.model");
              const catDoc: any = await CategoryModel.findById(product.categoryId).lean().exec();
              if (catDoc) {
                if (catDoc.slug) {
                  productCategories.add(catDoc.slug.toLowerCase());
                  if (LEAF_TO_PARENT_MAP[catDoc.slug.toLowerCase()]) {
                    productCategories.add(LEAF_TO_PARENT_MAP[catDoc.slug.toLowerCase()].toLowerCase());
                  }
                }
                if (catDoc.name) {
                  productCategories.add(catDoc.name.toLowerCase());
                  productCategories.add(catDoc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                }
                if (catDoc.parentId) {
                  const parentDoc: any = await CategoryModel.findById(catDoc.parentId).lean().exec();
                  if (parentDoc) {
                    if (parentDoc.slug) productCategories.add(parentDoc.slug.toLowerCase());
                    if (parentDoc.name) productCategories.add(parentDoc.name.toLowerCase());
                  }
                }
              }
            } catch {}
          }

          // 3. Exact or containment match check
          let matchesCat = false;
          for (const target of targetCategories) {
            if (productCategories.has(target)) {
              matchesCat = true;
              break;
            }
            if (
              product.magentoCategories &&
              product.magentoCategories.toLowerCase().includes(target)
            ) {
              matchesCat = true;
              break;
            }
          }

          if (!matchesCat) {
            isEligible = false;
          }
        } else if (coupon.scope === "product") {
          const prodList = (coupon.applicableProducts || []).map((p) => p.trim().toLowerCase());
          const sku = (product.sku || "").trim().toLowerCase();
          const pid = String((product as any)._id || "").toLowerCase();
          if (!prodList.includes(sku) && !prodList.includes(pid)) {
            isEligible = false;
          }
        }

        if (isEligible) {
          eligibleSubtotal += unitPrice * item.quantity;
        }
      }

      if (eligibleSubtotal === 0) {
        if (coupon.excludeSaleItems && anySaleItemExcluded) {
          throw new AppError(
            "This coupon cannot be combined with items already on sale or discounted",
            400
          );
        }
        if (coupon.scope === "brand") {
          throw new AppError(
            `This coupon is valid only for selected brands: ${(coupon.applicableBrands || []).join(", ")}`,
            400
          );
        }
        if (coupon.scope === "category") {
          throw new AppError("This coupon is valid only for selected product categories", 400);
        }
        if (coupon.scope === "product") {
          throw new AppError("This coupon is not applicable to any products in your cart", 400);
        }
        throw new AppError("No items in your cart qualify for this coupon", 400);
      }
    } else {
      // Fallback if full items array was not provided
      eligibleSubtotal = cartTotal || 0;
    }

    // 7. Minimum Purchase Check
    if (eligibleSubtotal < (coupon.minPurchase || 0)) {
      throw new AppError(
        `Minimum purchase of ₹${coupon.minPurchase.toLocaleString("en-IN")} required on qualifying items to use this coupon`,
        400
      );
    }

    // 8. Discount Calculation
    let discount = 0;
    if (coupon.discountType === "percent") {
      discount = (eligibleSubtotal * coupon.discountValue) / 100;
      if (typeof coupon.maxDiscountCap === "number" && coupon.maxDiscountCap > 0) {
        discount = Math.min(discount, coupon.maxDiscountCap);
      }
    } else {
      discount = coupon.discountValue;
    }

    // 9. Hard Zero-Price Floor Guardrail: Discount can NEVER exceed eligible subtotal
    discount = Math.min(discount, eligibleSubtotal);
    // Round to 2 decimal places
    discount = Math.round(discount * 100) / 100;

    return {
      isValid: true,
      code: coupon.code,
      discountAmount: discount,
      eligibleSubtotal,
      message: `Coupon "${coupon.code}" applied successfully! You save ₹${discount.toLocaleString("en-IN")}.`,
    };
  }

  static async createCoupon(data: Partial<ICoupon>): Promise<ICoupon> {
    const existing = await CouponRepository.findByCode(data.code || "");
    if (existing) {
      throw new AppError(`Coupon with code "${data.code}" already exists`, 409);
    }
    return await CouponRepository.create(data);
  }

  static async updateCoupon(id: string, data: Partial<ICoupon>): Promise<ICoupon> {
    const existing = await CouponRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Coupon");
    }

    if (data.code && data.code.toUpperCase().trim() !== existing.code) {
      const duplicate = await CouponRepository.findByCode(data.code);
      if (duplicate && String((duplicate as any)._id) !== id) {
        throw new AppError(`Coupon with code "${data.code}" already exists`, 409);
      }
    }

    const updated = await CouponRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError("Coupon");
    }
    return updated;
  }

  static async deleteCoupon(id: string): Promise<void> {
    const existing = await CouponRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Coupon");
    }
    await CouponRepository.delete(id);
  }

  static async getCouponById(id: string): Promise<ICoupon> {
    const coupon = await CouponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundError("Coupon");
    }
    return coupon;
  }

  static async listCoupons(
    query: { search?: string; status?: string; scope?: string; page?: number; limit?: number } = {}
  ): Promise<{ items: ICoupon[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const filter: any = {};

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      filter.$or = [
        { code: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
      ];
    }

    if (query.status === "active") {
      filter.isActive = true;
      filter.expiryDate = { $gte: new Date() };
    } else if (query.status === "inactive") {
      filter.isActive = false;
    } else if (query.status === "expired") {
      filter.expiryDate = { $lt: new Date() };
    }

    if (query.scope && query.scope !== "all_scopes") {
      filter.scope = query.scope;
    }

    const { items, total } = await CouponRepository.findAll(filter, page, limit);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async getPublicActiveCoupons(): Promise<Partial<ICoupon>[]> {
    const now = new Date();
    const filter: any = {
      isActive: true,
      expiryDate: { $gte: now },
      $or: [
        { startDate: { $exists: false } },
        { startDate: null },
        { startDate: { $lte: now } },
      ],
    };
    const { items } = await CouponRepository.findAll(filter, 1, 50);
    return items
      .filter((c: any) => {
        if (typeof c.totalUsageLimit === "number" && c.totalUsageLimit > 0) {
          if ((c.usageCount || 0) >= c.totalUsageLimit) return false;
        }
        return true;
      })
      .map((c: any) => ({
        _id: c._id,
        code: c.code,
        description: c.description || "",
        discountType: c.discountType,
        discountValue: c.discountValue,
        minPurchase: c.minPurchase || 0,
        maxDiscountCap: c.maxDiscountCap,
        expiryDate: c.expiryDate,
        scope: c.scope,
        firstOrderOnly: Boolean(c.firstOrderOnly),
        excludeSaleItems: Boolean(c.excludeSaleItems),
        applicableBrands: c.applicableBrands || [],
        applicableCategories: c.applicableCategories || [],
      }));
  }

  static async incrementUsage(code: string, userId?: string, session?: ClientSession): Promise<void> {
    await CouponRepository.incrementUsage(code, session);
  }

  static async decrementUsage(code: string, session?: ClientSession): Promise<void> {
    await CouponRepository.decrementUsage(code, session);
  }
}
