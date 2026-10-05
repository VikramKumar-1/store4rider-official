import type { Metadata } from "next";
import { ProfileForm } from "@/modules/account/components/ProfileForm";

export const metadata: Metadata = {
  title: "My Profile | Store4Riders",
  description: "Manage your Store4Riders account profile details.",
};

export default function AccountPage() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ProfileForm />
    </div>
  );
}
