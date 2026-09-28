import { logger } from "../../../core/utils/logger";

/**
 * Mock/Placeholder for BullMQ / Redis Queue Service.
 * In a full production environment, this would initialize a BullMQ Queue
 * with defaultJobOptions like attempts: 5, backoff: { type: 'exponential', delay: 2000 }
 */
export class ShipmentQueueService {
  
  static async addProviderCreationJob(shipmentId: string | any) {
    logger.info(`[Queue] Job added to create shipment for internal ID: ${shipmentId}`);
    
    // Simulating asynchronous background worker picking up the job
    // Real code: await myBullQueue.add("processShipment", { shipmentId }, { attempts: 3, backoff: { type: "exponential" } });
    
    setTimeout(async () => {
      try {
        const { ShipmentService } = require("./shipment.service");
        await ShipmentService.processProviderShipmentCreation(shipmentId);
      } catch (err: any) {
        logger.error(`[Queue Worker] Retry failed for ${shipmentId}: ${err.message}`);
      }
    }, 1000); // Trigger after 1 second for simulation
  }
}
