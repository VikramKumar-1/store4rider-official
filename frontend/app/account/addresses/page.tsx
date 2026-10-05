import type { Metadata } from "next";
import { AddressList } from "@/modules/account/components/AddressList";

export const metadata: Metadata = {
  title: "My Addresses | Store4Riders",
  description: "Manage your Store4Riders delivery addresses.",
};

export default function AddressesPage() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AddressList />
    </div>
  );
}
