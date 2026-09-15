import { CartRepository } from "./cart.repository";
import { ProductRepository } from "../product/product.repository";
import { SettingRepository } from "../settings/setting.repository";
import { ICart, ICartItem } from "@store4riders/shared-types";
import { calculateTax } from "@store4riders/shared-utils";

/**
 * @class CartService
 * @description Core business logic for Shopping Cart.
 * Highlights:
 * - Upserts carts automatically for new users.
 * - Auto-merges items if the same variant is added twice.
 * - Dynamically recalculates totals, 18% GST tax, and shipping on every action.
 */
export class CartService {
  
  static async getCart(userId: string): Promise<ICart> {
    let cart = await CartRepository.findByUserId(userId);
    if (!cart) {
      cart = await CartRepository.upsert(userId, { items: [], summary: { subtotal: 0, tax: 0, shipping: 0, total: 0 } });
    }
    return this.recalculateSummary(cart);
  }

  static async addItem(userId: string, item: ICartItem): Promise<ICart> {
    const cart = await this.getCart(userId);
    
    // Check if item exists in cart
    const existingIndex = cart.items.findIndex(i => i.productId === item.productId && i.variantId === item.variantId);
    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += item.quantity;
    } else {
      item.id = crypto.randomUUID();
      cart.items.push(item);
    }

    const updatedCart = await this.recalculateSummary(cart);
    return await CartRepository.upsert(userId, updatedCart);
  }

  static async recalculateSummary(cart: ICart): Promise<ICart> {
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await ProductRepository.findById(item.productId);
      if (product) {
        let price = product.basePrice;
        if (item.variantId) {
          const variant = product.variants.find(v => v.id === item.variantId);
          if (variant) price = variant.price;
        }
        subtotal += price * item.quantity;
      }
    }

    const settings = await SettingRepository.getSettings();
    const taxRate = settings.taxRate;
    const freeShippingThreshold = settings.freeShippingThreshold;
    const shippingCost = settings.shippingCost;

    const tax = calculateTax(subtotal, taxRate);
    const shipping = subtotal > 0 && subtotal < freeShippingThreshold ? shippingCost : 0;
    const total = subtotal + tax + shipping;

    cart.summary = { subtotal, tax, shipping, total };
    return cart;
  }
}
