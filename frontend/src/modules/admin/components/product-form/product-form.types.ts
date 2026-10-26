import { Dispatch, SetStateAction } from "react";

export interface ISpecDefinition {
  key: string;
  label: string;
  placeholder: string;
  presets: string[];
}

export interface ProductFormProps {
  mode: "create" | "edit";
  initialSlugOrId?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string;
  isBase?: boolean;
}

export interface ProductVariant {
  id?: string;
  sku: string;
  color: string;
  size: string;
  price: number | "";
  specialPrice?: number | "";
  stock: number | "";
  imageUrl?: string;
  altText?: string;
  weight?: number | "";
  status?: "enabled" | "disabled";
  visibility?: string;
  images?: Array<{ id: string; url: string; altText?: string }>;
}

export interface CustomAttribute {
  key: string;
  value: string;
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export type ProductFormTab = "basic" | "pricing" | "media" | "specs" | "variants" | "relations" | "seo";
