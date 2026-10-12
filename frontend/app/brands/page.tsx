import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandsDirectoryModule } from "@/modules/brands";

export const metadata: Metadata = {
  title: "Shop By Brand | All Motorcycle Brands A–Z | Store4Riders",
  description: "Browse authentic motorcycle helmets, riding gear, accessories, and performance parts by brand. Explore our complete A-Z brand directory at Store4Riders.",
  alternates: {
    canonical: "/brands",
  },
};

export default function BrandsPage() {
  return (
    <Suspense fallback={null}>
      <BrandsDirectoryModule />
    </Suspense>
  );
}
