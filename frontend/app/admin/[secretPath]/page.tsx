import { notFound } from "next/navigation";
import { Metadata } from "next";
import { AdminLogin } from "@/modules/admin/components/AdminLogin";

export const metadata: Metadata = {
  title: "Staff Authentication | Store4Riders",
  description: "Secure staff authentication portal",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

interface SecretAdminLoginPageProps {
  params: Promise<{ secretPath: string }>;
}

export default async function SecretAdminLoginPage({ params }: SecretAdminLoginPageProps) {
  const { secretPath } = await params;
  const configuredSecret = process.env.ADMIN_SECRET_PATH || process.env.NEXT_PUBLIC_ADMIN_SECRET_PATH || "rider-staff-gate";

  // Strict check: if the path segment does not match the secret slug, return 404
  if (secretPath !== configuredSecret) {
    notFound();
  }

  return <AdminLogin />;
}
