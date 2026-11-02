import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not Found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  const secretPath = process.env.NEXT_PUBLIC_ADMIN_SECRET_PATH || "rider-staff-gate";

  // In development, provide a smooth redirect to the secret slug so developers never get locked out
  if (process.env.NODE_ENV === "development") {
    redirect(`/admin/${secretPath}`);
  }

  // In production, generic /admin/login is dead and returns 404
  notFound();
}
