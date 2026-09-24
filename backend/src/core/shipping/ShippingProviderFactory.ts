import { ShippingProvider } from "./ShippingProvider";
import { ShiprocketProvider } from "./ShiprocketProvider";
import { DelhiveryProvider } from "./DelhiveryProvider";
import { XpressbeesProvider } from "./XpressbeesProvider";
import { AppError } from "../errors/AppError";

export class ShippingProviderFactory {
  static create(providerName: string): ShippingProvider {
    const name = providerName.toLowerCase();
    
    switch (name) {
      case "shiprocket":
        return new ShiprocketProvider();
      case "delhivery":
        return new DelhiveryProvider();
      case "xpressbees":
        return new XpressbeesProvider();
      default:
        throw new AppError(`Shipping provider '${providerName}' is not supported yet`, 501);
    }
  }
}
