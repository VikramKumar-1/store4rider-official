import { Suspense } from "react";
import { AuthModule } from "@/modules/auth";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-white" />}>
      <AuthModule type="register" />
    </Suspense>
  );
}
