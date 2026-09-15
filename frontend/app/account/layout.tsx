import { AccountLayoutModule } from "@/modules/account/components/AccountLayoutModule";

export const metadata = {
  title: "My Account | Store4Riders",
  description: "My Account page.",
};

export default function AccountLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <AccountLayoutModule>{children}</AccountLayoutModule>;
}
