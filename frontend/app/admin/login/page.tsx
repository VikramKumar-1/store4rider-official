import { Metadata } from "next";
import { AdminLogin } from "@/modules/admin/components/AdminLogin";

export const metadata: Metadata = {
  title: "Admin Login | Store4Riders",
  description: "Secure admin portal login",
};

export default function AdminLoginPage() {
  return <AdminLogin />;
}
