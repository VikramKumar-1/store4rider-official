import React from "react";
import { ProductMigration } from "@/modules/admin/components/ProductMigration";

export const metadata = {
  title: "Data Migration | Store4Riders Admin",
  description: "Upload and migrate Magento CSV data",
};

export default function MigrationPage() {
  return <ProductMigration />;
}
