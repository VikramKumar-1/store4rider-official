import { FailedTransactionsModule } from "@/modules/admin-orders";

export const metadata = {
  title: "Failed Transactions & Abandoned Checkouts | Admin",
  description: "Track uncaptured payment attempts and abandoned checkouts to recover sales.",
};

export default function AdminFailedTransactionsPage() {
  return <FailedTransactionsModule />;
}
