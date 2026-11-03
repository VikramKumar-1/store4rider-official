import { PaymentGatewayType } from "@store4riders/shared-types";
import { PaymentGateway } from "./PaymentGateway";
import { PayUGateway } from "./PayUGateway";
import { CCavenueGateway } from "./CCavenueGateway";
import { SnapmintGateway } from "./SnapmintGateway";
import { GooglePayUpiGateway } from "./GooglePayUpiGateway";
import { AppError } from "../errors/AppError";

export class PaymentGatewayFactory {
  static create(type: PaymentGatewayType | string): PaymentGateway {
    switch (type) {
      case "upi":
      case "gpay":
        return new GooglePayUpiGateway();
      case "payu":
        return new PayUGateway();
      case "ccavenue":
        return new CCavenueGateway();
      case "snapmint":
        return new SnapmintGateway();
      default:
        throw new AppError(`Payment gateway '${type}' is not supported`, 400);
    }
  }
}
