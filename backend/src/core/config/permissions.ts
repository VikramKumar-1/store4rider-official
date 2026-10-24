import { UserRole } from "@store4riders/shared-types";

export enum PermissionAction {
  // User Management
  MANAGE_USERS = "manage_users",
  MANAGE_ROLES = "manage_roles",
  
  // Product & Catalog
  MANAGE_PRODUCTS = "manage_products",
  MANAGE_CATEGORIES = "manage_categories",
  MANAGE_BRANDS = "manage_brands",
  
  // Orders & Shipping
  MANAGE_ORDERS = "manage_orders",
  MANAGE_RETURNS = "manage_returns",
  MANAGE_SHIPPING = "manage_shipping",
  DELETE_ORDERS = "delete_orders",
  
  // Customer Support & Inquiries
  MANAGE_SUPPORT = "manage_support",
  
  // Marketing & Content
  MANAGE_PROMOTIONS = "manage_promotions",
  MANAGE_BLOGS = "manage_blogs",
  MANAGE_NEWSLETTER = "manage_newsletter",
  
  // Settings & System
  VIEW_DASHBOARD = "view_dashboard",
  MANAGE_SETTINGS = "manage_settings",
}

type RolePermissions = {
  [key in UserRole]: PermissionAction[] | "all";
};

export const ROLE_PERMISSIONS: RolePermissions = {
  super_admin: "all",
  admin: [
    PermissionAction.MANAGE_USERS,
    PermissionAction.MANAGE_ROLES,
    PermissionAction.MANAGE_PRODUCTS,
    PermissionAction.MANAGE_CATEGORIES,
    PermissionAction.MANAGE_BRANDS,
    PermissionAction.MANAGE_ORDERS,
    PermissionAction.MANAGE_RETURNS,
    PermissionAction.MANAGE_SHIPPING,
    PermissionAction.DELETE_ORDERS,
    PermissionAction.MANAGE_SUPPORT,
    PermissionAction.MANAGE_PROMOTIONS,
    PermissionAction.MANAGE_BLOGS,
    PermissionAction.MANAGE_NEWSLETTER,
    PermissionAction.VIEW_DASHBOARD,
    PermissionAction.MANAGE_SETTINGS,
  ],
  logistic: [
    PermissionAction.VIEW_DASHBOARD,
    PermissionAction.MANAGE_ORDERS,
    PermissionAction.MANAGE_RETURNS,
    PermissionAction.MANAGE_SHIPPING,
  ],
  customer_care: [
    PermissionAction.VIEW_DASHBOARD,
    PermissionAction.MANAGE_ORDERS,
    PermissionAction.MANAGE_SUPPORT,
  ],
  product_manager: [
    PermissionAction.MANAGE_PRODUCTS,
    PermissionAction.MANAGE_CATEGORIES,
    PermissionAction.MANAGE_BRANDS,
    PermissionAction.VIEW_DASHBOARD,
  ],
  order_manager: [
    PermissionAction.MANAGE_ORDERS,
    PermissionAction.MANAGE_RETURNS,
    PermissionAction.MANAGE_SHIPPING,
    PermissionAction.VIEW_DASHBOARD,
  ],
  marketing_manager: [
    PermissionAction.MANAGE_PROMOTIONS,
    PermissionAction.MANAGE_BLOGS,
    PermissionAction.MANAGE_NEWSLETTER,
    PermissionAction.VIEW_DASHBOARD,
  ],
  customer_support: [
    PermissionAction.VIEW_DASHBOARD,
    PermissionAction.MANAGE_ORDERS,
    PermissionAction.MANAGE_SUPPORT,
  ],
  customer: [],
};

export const hasPermission = (role: UserRole, action: PermissionAction): boolean => {
  const permissions = ROLE_PERMISSIONS[role];
  if (permissions === "all") return true;
  return permissions.includes(action);
};
