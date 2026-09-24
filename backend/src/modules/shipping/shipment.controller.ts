import { NextRequest, NextResponse } from "next/server";
import { ShipmentService } from "./shipment.service";
import { ShipmentValidator } from "./shipment.validator";
import { ShipmentRepository } from "./shipment.repository";
import { ApiResponse } from "../../core/response/ApiResponse";
import { AppError } from "../../core/errors/AppError";

export class ShipmentController {
  
  static async create(req: NextRequest) {
    const input = await ShipmentValidator.validateCreate(req);
    const shipment = await ShipmentService.createShipment(
      input.orderId, 
      input.provider, 
      { length: input.length, breadth: input.breadth, height: input.height, weight: input.weight }
    );
    return ApiResponse.success(shipment, "Shipment created successfully", 201);
  }

  static async getById(req: NextRequest, id: string) {
    const shipment = await ShipmentRepository.findById(id);
    if (!shipment) throw new AppError("Shipment not found", 404);
    return ApiResponse.success(shipment, "Shipment retrieved");
  }

  static async getByOrderId(req: NextRequest, orderId: string) {
    const shipments = await ShipmentRepository.findByOrderId(orderId);
    return ApiResponse.success(shipments, "Shipments retrieved");
  }

  static async syncTracking(req: NextRequest, id: string) {
    const shipment = await ShipmentService.syncTracking(id);
    return ApiResponse.success(shipment, "Tracking synchronized successfully");
  }

  static async updateStatus(req: NextRequest, id: string) {
    const data = await ShipmentValidator.validateStatusUpdate(req, id);
    const shipment = await ShipmentRepository.updateStatus(data.id, data.status as any);
    if (!shipment) throw new AppError("Shipment not found", 404);
    return ApiResponse.success(shipment, "Status updated");
  }

  static async webhook(req: NextRequest, provider: string) {
    let payload;
    try {
      payload = await req.json();
    } catch {
      payload = await req.text();
    }
    await ShipmentService.handleWebhook(provider, payload);
    return NextResponse.json({ success: true });
  }

  static async getRates(req: NextRequest) {
    const { deliveryPincode, weightKg, isCod } = await ShipmentValidator.validateGetRates(req);
    const rates = await ShipmentService.compareRates(deliveryPincode, weightKg, isCod);
    return ApiResponse.success(rates, "Shipping rates fetched successfully");
  }
}
