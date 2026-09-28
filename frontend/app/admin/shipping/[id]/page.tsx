import { ShipmentDetailView } from "@/modules/admin-shipping/components/ShipmentDetailView";

export const metadata = {
  title: "Shipment Details | Admin | Store4Riders",
  description: "View and manage shipment details."
};

export default function AdminShipmentDetailPage({ params }: { params: { id: string } }) {
  return <ShipmentDetailView shipmentId={params.id} />;
}
