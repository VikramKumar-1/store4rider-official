import PDFDocument from "pdfkit";
import { IOrder } from "@store4riders/shared-types";
import { formatPrice } from "@store4riders/shared-utils";
import { S3Service } from "../aws/S3Service";

export class InvoiceGenerator {
  /**
   * Generates a GST-compliant invoice PDF buffer for a given order.
   */
  static async generateInvoiceBuffer(order: IOrder): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];
        doc.on("data", (buffer) => buffers.push(buffer));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fontSize(20).font("Helvetica-Bold").text("TAX INVOICE", { align: "right" });
        doc.moveDown();

        // Company Details
        doc.fontSize(10).font("Helvetica-Bold").text("Store4Riders");
        doc.font("Helvetica").text("123 Rider Street, Moto City");
        doc.text("State: Maharashtra, 411001");
        doc.text("GSTIN: 27AAAAA0000A1Z5");
        doc.text("Email: support@store4riders.com");
        doc.moveDown();

        // Order & Customer Details
        doc.font("Helvetica-Bold").text("Bill To:");
        doc.font("Helvetica").text(order.shippingAddress.fullName);
        doc.text(order.shippingAddress.addressLine1);
        if (order.shippingAddress.addressLine2) doc.text(order.shippingAddress.addressLine2);
        doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`);
        doc.text(`Phone: ${order.shippingAddress.phone}`);
        
        doc.moveUp(5);
        doc.text(`Order Number: ${order.orderNumber || order.id}`, { align: "right" });
        doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: "right" });
        doc.text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, { align: "right" });
        doc.moveDown(2);

        // Table Header
        const tableTop = doc.y + 10;
        doc.font("Helvetica-Bold");
        doc.text("Item / SKU", 50, tableTop);
        doc.text("Qty", 280, tableTop);
        doc.text("Unit Price", 330, tableTop);
        doc.text("Tax", 400, tableTop);
        doc.text("Total", 480, tableTop);
        
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        doc.moveDown();

        let currentY = tableTop + 25;
        doc.font("Helvetica");

        // Table Rows
        order.items.forEach((item) => {
          doc.text(`${item.name} (${item.sku})`, 50, currentY, { width: 220 });
          doc.text(item.quantity.toString(), 280, currentY);
          doc.text(formatPrice(item.unitPrice), 330, currentY);
          // Assuming tax is calculated evenly across items for this simple representation
          const taxStr = `${order.pricing.taxRate}%`;
          doc.text(taxStr, 400, currentY);
          doc.text(formatPrice(item.unitPrice * item.quantity), 480, currentY);
          currentY += 20;
        });

        doc.moveTo(50, currentY + 10).lineTo(550, currentY + 10).stroke();

        // Totals
        currentY += 25;
        doc.font("Helvetica-Bold");
        doc.text("Subtotal:", 350, currentY);
        doc.text(formatPrice(order.pricing.subtotal), 480, currentY);
        currentY += 15;
        
        if (order.pricing.discount > 0 || order.pricing.couponDiscount > 0) {
          doc.text("Discount:", 350, currentY);
          doc.text(`-${formatPrice(order.pricing.discount + order.pricing.couponDiscount)}`, 480, currentY);
          currentY += 15;
        }

        doc.text(`Tax (${order.pricing.taxRate}%):`, 350, currentY);
        doc.text(formatPrice(order.pricing.tax), 480, currentY);
        currentY += 15;

        doc.text("Shipping:", 350, currentY);
        doc.text(formatPrice(order.pricing.shipping), 480, currentY);
        currentY += 15;

        doc.moveTo(350, currentY + 5).lineTo(550, currentY + 5).stroke();
        currentY += 15;

        doc.fontSize(12);
        doc.text("Grand Total:", 350, currentY);
        doc.text(formatPrice(order.pricing.total), 480, currentY);

        // Footer
        doc.fontSize(10).font("Helvetica");
        doc.text("Thank you for shopping with Store4Riders!", 50, 700, { align: "center" });
        doc.text("For returns and exchanges, please visit our website.", 50, 715, { align: "center" });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generates the invoice and uploads it to S3, returning the URL.
   */
  static async getOrGenerateInvoiceUrl(order: IOrder): Promise<string> {
    const pdfBuffer = await this.generateInvoiceBuffer(order);
    
    // Upload to S3
    const uploadUrl = await S3Service.uploadFile(
      {
        buffer: pdfBuffer,
        originalname: `invoice_${order.orderNumber || order.id}.pdf`,
        mimetype: "application/pdf"
      } as any,
      "invoices"
    );

    return uploadUrl;
  }
}
