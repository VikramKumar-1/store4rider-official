import { ExchangeRequestsModule } from "@/modules/admin-orders";

export const metadata = {
  title: "Customer Exchange Requests | Admin",
  description: "Review and process size replacements and defect exchange requests.",
};

export default function AdminExchangeRequestsPage() {
  return <ExchangeRequestsModule />;
}
