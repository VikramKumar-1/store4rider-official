export interface IUserAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}
export type UserRole = 
  | "super_admin"
  | "admin"
  | "product_manager"
  | "order_manager"
  | "marketing_manager"
  | "customer_support"
  | "customer";

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  addresses: IUserAddress[];
  createdAt: Date;
  updatedAt: Date;
}
