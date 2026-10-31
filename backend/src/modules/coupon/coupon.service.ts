import { CouponRepository } from "./coupon.repository";
import { ICoupon, ICouponValidationResult } from "@store4riders/shared-types";
import { AppError, NotFoundError } from "../../core/errors/AppError";
import { OrderRepository } from "../order/order.repository";
import { ProductRepository } from "../product/product.repository";
import { ClientSession } from "mongoose";

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
          const catList = (coupon.applicableCategories || []).map((c) => c.trim().toLowerCase());
          const productCat = (product.categoryId || "").trim().toLowerCase();
          const productMagCats = (product.magentoCategories || "").trim().toLowerCase();
          const matchesCat = catList.some(
            (c) => productCat === c || (productMagCats && productMagCats.includes(c))
          );
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

  static async incrementUsage(code: string, userId?: string, session?: ClientSession): Promise<void> {
    await CouponRepository.incrementUsage(code, session);
  }

  static async decrementUsage(code: string, session?: ClientSession): Promise<void> {
    await CouponRepository.decrementUsage(code, session);
  }
}
