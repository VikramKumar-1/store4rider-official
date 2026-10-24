import { ShipmentDetailView } from "@/modules/admin-shipping/components/ShipmentDetailView";

export const metadata = {
  title: "Shipment Details | Admin | Store4Riders",
  description: "View and manage shipment details."
};

export default async function AdminShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShipmentDetailView shipmentId={id} />;
}
