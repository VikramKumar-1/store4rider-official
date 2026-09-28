import { AppError } from "../../../core/errors/AppError";
import { ShipmentModel } from "../shipment.model";
import { ShippingProviderFactory } from "../../../core/shipping/ShippingProviderFactory";
import { logger } from "../../../core/utils/logger";

export class LabelService {
  
  /**
   * Scenario #7: Label generation fails after shipment creation.
   * This service retries fetching/generating the label without recreating the shipment.
   */
  static async generateLabel(shipmentId: string): Promise<string> {
    const shipment = await ShipmentModel.findById(shipmentId);
    
    if (!shipment) {
      throw new AppError(`Shipment not found: ${shipmentId}`, 404);
    }

    if (!shipment.awb && !shipment.providerShipmentId) {
      throw new AppError("Cannot generate label: Shipment has no AWB or Provider ID assigned yet.", 400);
    }

    if (shipment.labelUrl) {
      logger.info(`[LabelService] Label already exists for shipment ${shipmentId}. Returning cached URL.`);
      return shipment.labelUrl;
    }

    try {
      const providerInstance = ShippingProviderFactory.getProvider(shipment.provider);
      logger.info(`[LabelService] Fetching label from ${shipment.provider} for AWB ${shipment.awb}`);
      
      const reference = shipment.awb || shipment.providerShipmentId || "";
      const labelUrl = await providerInstance.generateLabel(reference);
      
      if (!labelUrl) {
        throw new AppError("Courier API did not return a valid label URL.", 400);
      }
      
      shipment.labelUrl = labelUrl;
      await shipment.save();
      
      return labelUrl;
    } catch (error: any) {
      logger.error(`[LabelService] Failed to generate label for ${shipmentId}: ${error.message}`);
      // In a real system, you might queue this again if it's a 500 error.
      // Throw error to notify Admin panel that manual retry is needed.
      throw new AppError(`Label Generation Failed: ${error.message}`, 500);
    }
  }
}
