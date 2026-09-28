export interface IWarehouse {
  id?: string;
  _id?: string;
  name: string;
  warehouseCode: string; // unique
  contactPerson: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string; // default "India"
  pincode: string;
  shiprocketLocationId?: string;
  delhiveryWarehouseName?: string;
  xpressbeesWarehouseId?: string;
  isActive: boolean; // default true
  isDefault: boolean; // default false
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
