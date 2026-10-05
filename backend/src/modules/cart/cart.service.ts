import { CartRepository } from "./cart.repository";
import { ProductRepository } from "../product/product.repository";
import { SettingRepository } from "../settings/setting.repository";
import { ICart, ICartItem } from "@store4riders/shared-types";
import { calculateTax, getTaxRateFromClass } from "@store4riders/shared-utils";

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
    const existingIndex = cart.items.findIndex(
      (i) => i.productId === item.productId && (i.variantId || "") === (item.variantId || "")
    );
    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += item.quantity;
      if (item.product) {
        cart.items[existingIndex].product = {
          ...(cart.items[existingIndex].product || {}),
          ...item.product,
        };
      }
    } else {
      item.id = item.id || crypto.randomUUID();
      cart.items.push(item);
    }

    const updatedCart = await this.recalculateSummary(cart);
    return await CartRepository.upsert(userId, updatedCart);
  }

  static async updateQuantity(userId: string, productId: string, quantity: number, variantId?: string): Promise<ICart> {
    const cart = await this.getCart(userId);

    if (quantity <= 0) {
      cart.items = cart.items.filter(
        (i) => !(i.productId === productId && (i.variantId || "") === (variantId || ""))
      );
    } else {
      const item = cart.items.find(
        (i) => i.productId === productId && (i.variantId || "") === (variantId || "")
      );
      if (item) {
        item.quantity = quantity;
      }
    }

    const updatedCart = await this.recalculateSummary(cart);
    return await CartRepository.upsert(userId, updatedCart);
  }

  static async removeItem(userId: string, productId: string, variantId?: string, itemId?: string): Promise<ICart> {
    const cart = await this.getCart(userId);

    cart.items = cart.items.filter((i) => {
      if (itemId && i.id === itemId) return false;
      if (i.productId === productId) {
        if (variantId !== undefined) {
          return (i.variantId || "") !== (variantId || "");
        }
        return false;
      }
      return true;
    });

    const updatedCart = await this.recalculateSummary(cart);
    return await CartRepository.upsert(userId, updatedCart);
  }

  static async syncCart(userId: string, localItems: ICartItem[]): Promise<ICart> {
    const cart = await this.getCart(userId);

    for (const localItem of localItems) {
      const existingIndex = cart.items.findIndex(
        (i) => i.productId === localItem.productId && (i.variantId || "") === (localItem.variantId || "")
      );
      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += localItem.quantity;
        if (localItem.product) {
          cart.items[existingIndex].product = {
            ...(cart.items[existingIndex].product || {}),
            ...localItem.product,
          };
        }
      } else {
        cart.items.push({
          ...localItem,
          id: localItem.id || crypto.randomUUID(),
        });
      }
    }

    const updatedCart = await this.recalculateSummary(cart);
    return await CartRepository.upsert(userId, updatedCart);
  }

  static async clearCart(userId: string, session?: any): Promise<void> {
    await CartRepository.clear(userId, session);
  }

  static async recalculateSummary(cart: ICart): Promise<ICart> {
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await ProductRepository.findById(item.productId);
      if (product) {
        let price = product.basePrice;
        if (product.specialPrice) {
          const now = new Date();
          const fromDate = product.specialPriceFromDate ? new Date(product.specialPriceFromDate) : null;
          const toDate = product.specialPriceToDate ? new Date(product.specialPriceToDate) : null;
          
          const isStarted = fromDate ? now >= fromDate : true;
          const isNotExpired = toDate ? now <= toDate : true;
          
          if (isStarted && isNotExpired) {
            price = product.specialPrice;
          }
        }
        if (item.variantId && product.variants?.length) {
          const variant = product.variants.find(
            (v) => v.id === item.variantId || v.sku === item.variantId
          );
          if (variant && variant.price) {
            price = variant.price;
          }
        }
        subtotal += price * item.quantity;
        
        // Calculate per-item tax
        const settings = await SettingRepository.getSettings();
        const itemTaxRate = getTaxRateFromClass(product.taxClassName, settings.taxRate);
        const itemTax = calculateTax(price * item.quantity, itemTaxRate);
        
        // Enrich product details so all devices receive full render data
        item.product = {
          _id: String((product as any)._id || (product as any).id),
          id: String((product as any)._id || (product as any).id),
          name: product.name,
          basePrice: product.basePrice,
          price: price,
          specialPrice: product.specialPrice,
          images: product.images || [],
          image: product.images?.[0]?.url || (item.product?.image || ""),
          slug: product.slug,
          taxClassName: product.taxClassName,
          allowBackorders: product.allowBackorders,
          ...(item.product || {}),
        };
        // Pass the calculated tax back up
        (item as any).calculatedTax = itemTax;
      }
    }

    const settings = await SettingRepository.getSettings();
    const freeShippingThreshold = settings.freeShippingThreshold;
    const shippingCost = settings.shippingCost;

    let totalTax = 0;
    for (const item of cart.items) {
      if ((item as any).calculatedTax) {
        totalTax += (item as any).calculatedTax;
        delete (item as any).calculatedTax;
      } else {
        // Fallback for edge cases
        totalTax += calculateTax(
          ((item.product as any)?.price || 0) * item.quantity, 
          settings.taxRate
        );
      }
    }

    const shipping = subtotal > 0 && subtotal < freeShippingThreshold ? shippingCost : 0;
    const total = subtotal + totalTax + shipping;

    cart.summary = { subtotal, tax: totalTax, shipping, total };
    return cart;
  }
}
