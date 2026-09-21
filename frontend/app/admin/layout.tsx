import { ReactNode } from "react";
import { AdminLayout } from "@/modules/admin/components/AdminLayout";

export const metadata = {
  title: "Admin Dashboard | Store4Riders",
  description: "Admin panel for Store4Riders",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
