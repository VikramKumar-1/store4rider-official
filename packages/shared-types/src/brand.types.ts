export interface IBrand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  showInMenu?: boolean;
  menuGroup?: string;
  createdAt: Date;
  updatedAt: Date;
}
