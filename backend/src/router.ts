import { NextRequest, NextResponse } from "next/server";
import { productRouter } from "./modules/product/product.route";
import { userRouter } from "./modules/user/user.route";
import { authRouter } from "./modules/auth/auth.route";
import { brandRouter } from "./modules/brand/brand.route";
import { categoryRouter } from "./modules/category/category.route";
import { cartRouter } from "./modules/cart/cart.route";
import { orderRouter } from "./modules/order/order.route";
import { reviewRouter } from "./modules/review/review.route";
import { wishlistRouter } from "./modules/wishlist/wishlist.route";
import { couponRouter } from "./modules/coupon/coupon.route";
import { uploadRouter } from "./modules/upload/upload.route";
import { docsRouter } from "./modules/docs/docs.route";
import { healthRouter } from "./modules/health/health.route";
import { adminRouter } from "./modules/admin/admin.route";
import { searchRouter } from "./modules/search/search.route";
import { paymentRouter } from "./modules/payment/payment.route";
import { shippingRouter } from "./modules/shipping/shipping.route";
import { settingRouter } from "./modules/settings/setting.route";
import { warehouseRouter } from "./modules/warehouse/warehouse.route";
import { returnRouter } from "./modules/return/return.route";
import { pincodeRouter } from "./modules/pincode/pincode.route";
import { cronRouter } from "./modules/cron/cron.route";
import { migrationRouter } from "./modules/migration/migration.route";
import { homepageRouter } from "./modules/homepage/homepage.route";
import { contactRouter } from "./modules/contact/contact.route";
import { blogRouter } from "./modules/blog/blog.route";

export async function centralRouter(req: NextRequest, routePath: string[]) {
  if (routePath.join("/") === "debug-images") {
    const { ProductModel } = await import("./modules/product/product.model");
    
    // Check how many products have 'full-face-helmets' in categorySlugs
    const fullFaceProducts = await ProductModel.find({ categorySlugs: "full-face-helmets" }).select("sku name categorySlugs").lean().exec();
    const otherProducts = await ProductModel.find({ categorySlugs: "full-face-helmet" }).select("sku name categorySlugs").lean().exec();
    
    // Look for Axor helmet to see its exact categorySlugs
    const axorProduct = await ProductModel.findOne({ name: /axor.*hunter/i }).select("sku name magentoCategories categorySlugs").lean().exec();

    return NextResponse.json({
      success: true,
      fullFaceHelmetsPluralCount: fullFaceProducts.length,
      fullFaceHelmetSingularCount: otherProducts.length,
      axorProduct: axorProduct,
      first5: fullFaceProducts.slice(0, 5)
    });
  }

  const [module, ...rest] = routePath;
  
  switch (module) {
    case "admin": return adminRouter(req, rest);
    case "docs": return docsRouter(req, rest);
    case "health": return healthRouter(req, rest);
    case "products": return productRouter(req, rest);
    case "users": return userRouter(req, rest);
    case "auth": return authRouter(req, rest);
    case "brands": return brandRouter(req, rest);
    case "categories": return categoryRouter(req, rest);
    case "cart": return cartRouter(req, rest);
    case "orders": return orderRouter(req, rest);
    case "reviews": return reviewRouter(req, rest);
    case "wishlist": return wishlistRouter(req, rest);
    case "coupons": return couponRouter(req, rest);
    case "upload": return uploadRouter(req, rest);
    case "search": return searchRouter(req, rest.join("/"));
    case "payments": return paymentRouter(req, rest.join("/"));
    case "shipping": 
    case "shipments": return shippingRouter(req, rest);
    case "settings": return settingRouter(req, rest.join("/"));
    case "homepage": return homepageRouter(req, rest.join("/"));
    case "warehouses": return warehouseRouter(req, rest);
    case "returns": return returnRouter(req, rest);
    case "pincodes": return pincodeRouter(req, rest);
    case "cron": return cronRouter(req, rest);
    case "migration": return migrationRouter(req, rest);
    case "contact":
    case "support": return contactRouter(req, rest);
    case "blog":
    case "blogs": return blogRouter(req, rest);
    default: return null;
  }
}
