import crypto from "crypto";
import { AppError } from "../../../core/errors/AppError";
import { ShippingRateQuoteModel, IShippingRateQuote } from "../models/shipping-rate-quote.model";
import { ShippingProviderFactory } from "../../../core/shipping/ShippingProviderFactory";
import { logger } from "../../../core/utils/logger";

export type SelectionStrategy = "LOWEST_COST" | "FASTEST_DELIVERY" | "LOWEST_COST_WITHIN_SLA";

interface RateCalculationParams {
  pickupPincode: string;
  deliveryPincode: string;
  weightKg: number;
  isCod: boolean;
  orderValue: number;
  dimensions?: { length: number; breadth: number; height: number };
}

export class RateService {
  
  /**
   * Generates a unique fingerprint for caching and idempotency
   */
  private static generateFingerprint(params: RateCalculationParams): string {
    const raw = `${params.pickupPincode}_${params.deliveryPincode}_${params.weightKg}_${params.isCod ? 'COD' : 'PREPAID'}`;
    return crypto.createHash("md5").update(raw).digest("hex");
  }

  /**
   * Retrieves quotes. Respects Admin settings (Active/Inactive) and forced manual override.
   */
  static async calculateRates(
    params: RateCalculationParams, 
    forceLive: boolean = false,
    forcedProvider?: string
  ): Promise<IShippingRateQuote[]> {
    
    // EDGE CASE 1: Master Kill Switch
    const { ShippingSettingsModel } = require("../models/shipping-settings.model");
    let settings = await ShippingSettingsModel.findOne();
    
    // Seed default settings if not exists
    if (!settings) {
      settings = await ShippingSettingsModel.create({
        providers: [
          { providerName: "shiprocket", isActive: true, priority: 1 },
          { providerName: "delhivery", isActive: true, priority: 2 },
          { providerName: "xpressbees", isActive: true, priority: 3 }
        ],
        globalShippingPause: false
      });
    }

    if (settings.globalShippingPause) {
      throw new AppError("SHIPPING_PAUSED: Shipping operations are currently suspended by Admin.", 503);
    }

    const fingerprint = this.generateFingerprint(params);
    
    // 1. Check valid cache first
    if (!forceLive && !forcedProvider) {
      const cachedQuotes = await ShippingRateQuoteModel.find({
        pickupPincode: params.pickupPincode,
        deliveryPincode: params.deliveryPincode,
        weightKg: params.weightKg,
        isCod: params.isCod,
        expiresAt: { $gt: new Date() }
      }).exec();

      if (cachedQuotes.length > 0) {
        // Filter out cached quotes if admin just turned off that provider 1 second ago
        const activeProviderNames = settings.providers.filter((p: any) => p.isActive).map((p: any) => p.providerName);
        const validCachedQuotes = cachedQuotes.filter(q => activeProviderNames.includes(q.provider));
        
        if (validCachedQuotes.length > 0) {
          logger.info(`[RateService] Using cached rates for fingerprint: ${fingerprint}`);
          return validCachedQuotes;
        }
      }
    }

    logger.info(`[RateService] Fetching LIVE rates for fingerprint: ${fingerprint}`);
    
    // 2. Fetch Live ONLY from Active Providers
    const allProviders = ShippingProviderFactory.getAllProviders();
    let eligibleProvidersToCall = allProviders.filter((provider: any) => {
      const setting = settings.providers.find((p: any) => p.providerName === provider.getName());
      return setting && setting.isActive === true;
    });

    // EDGE CASE 2: Admin turned off ALL providers
    if (eligibleProvidersToCall.length === 0) {
      throw new AppError("SHIPPING_UNAVAILABLE: All shipping providers are currently disabled by Admin.", 503);
    }

    // EDGE CASE 3: Admin Manual Override (Hybrid Mode)
    if (forcedProvider) {
      const forced = eligibleProvidersToCall.find((p: any) => p.getName() === forcedProvider);
      if (!forced) {
        throw new AppError(`MANUAL_OVERRIDE_FAILED: Provider '${forcedProvider}' is either invalid or currently disabled by Admin.`, 400);
      }
      // Restrict array to only the forced provider
      eligibleProvidersToCall = [forced];
    }

    const liveQuotesPromises = eligibleProvidersToCall.map(async (provider: any) => {
      try {
        const rateResponse = await provider.calculateRate({
          originPincode: params.pickupPincode,
          destinationPincode: params.deliveryPincode,
          weightKg: params.weightKg,
          isCod: params.isCod,
          orderValue: params.orderValue,
          dimensions: params.dimensions
        });

        return {
          provider: provider.getName(),
          ...params,
          totalCharge: rateResponse.totalCharge,
          baseFreight: rateResponse.baseFreight,
          codCharge: rateResponse.codCharge,
          estimatedDays: rateResponse.estimatedDays,
          courierPartnerName: rateResponse.courierPartnerName,
          isEligible: true,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) 
        };
      } catch (error: any) {
        logger.error(`[RateService] Provider ${provider.getName()} failed: ${error.message}`);
        return {
          provider: provider.getName(),
          ...params,
          totalCharge: 0,
          baseFreight: 0,
          estimatedDays: 0,
          isEligible: false,
          ineligibilityReason: error.message,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        };
      }
    });

    const quoteResults = await Promise.all(liveQuotesPromises);
    const savedQuotes = await ShippingRateQuoteModel.insertMany(quoteResults);
    return savedQuotes as unknown as IShippingRateQuote[];
  }

  /**
   * Strategy Pattern to select the best provider based on business rules
   */
  static async selectBestProvider(
    params: RateCalculationParams, 
    strategy: SelectionStrategy = "LOWEST_COST",
    maxSlaDays: number = 7,
    forcedProvider?: string
  ): Promise<IShippingRateQuote> {
    
    // Pass forcedProvider down to calculateRates
    const allQuotes = await this.calculateRates(params, false, forcedProvider);
    const eligibleQuotes = allQuotes.filter(q => q.isEligible);
    
    // EDGE CASE 4: Serviceability failed for all active providers
    if (eligibleQuotes.length === 0) {
      throw new AppError("SHIPPING_UNAVAILABLE: No providers can service this order (Pincode/Weight/COD restriction).", 400);
    }

    // If Admin forced a provider, it will be the only one in the list anyway, but we return it directly.
    if (forcedProvider) {
      return eligibleQuotes[0];
    }

    switch (strategy) {
      case "LOWEST_COST":
        return eligibleQuotes.sort((a, b) => a.totalCharge - b.totalCharge)[0];
        
      case "FASTEST_DELIVERY":
        return eligibleQuotes.sort((a, b) => a.estimatedDays - b.estimatedDays)[0];
        
      case "LOWEST_COST_WITHIN_SLA":
        const quotesWithinSla = eligibleQuotes.filter(q => q.estimatedDays <= maxSlaDays);
        if (quotesWithinSla.length > 0) {
          return quotesWithinSla.sort((a, b) => a.totalCharge - b.totalCharge)[0];
        }
        return eligibleQuotes.sort((a, b) => a.estimatedDays - b.estimatedDays)[0];
        
      default:
        return eligibleQuotes.sort((a, b) => a.totalCharge - b.totalCharge)[0];
    }
  }
}
