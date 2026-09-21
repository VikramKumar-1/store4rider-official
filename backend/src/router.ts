import { NextRequest } from "next/server";
import { productRouter } from "./modules/product/product.route";
import { userRouter } from "./modules/user/user.route";
import { authRouter } from "./modules/auth/auth.route";
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

export async function centralRouter(req: NextRequest, routePath: string[]) {
  const [module, ...rest] = routePath;
  
  switch (module) {
    case "admin": return adminRouter(req, rest);
    case "docs": return docsRouter(req, rest);
    case "health": return healthRouter(req, rest);
    case "products": return productRouter(req, rest);
    case "users": return userRouter(req, rest);
    case "auth": return authRouter(req, rest);
    case "categories": return categoryRouter(req, rest);
    case "cart": return cartRouter(req, rest);
    case "orders": return orderRouter(req, rest);
    case "reviews": return reviewRouter(req, rest);
    case "wishlist": return wishlistRouter(req, rest);
    case "coupons": return couponRouter(req, rest);
    case "upload": return uploadRouter(req, rest);
    default: return null;
  }
}
