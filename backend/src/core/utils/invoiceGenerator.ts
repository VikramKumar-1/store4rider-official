import PDFDocument from "pdfkit";
import { IOrder } from "@store4riders/shared-types";
import { formatPrice } from "@store4riders/shared-utils";
import { S3Service } from "../aws/S3Service";
import path from "path";
import fs from "fs";

function numberToWords(num: number): string {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (num === 0) return "Zero Rupees Only";
  
  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " And " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
  };
  
  return convert(Math.floor(num)) + " Rupees Only";
}

export class InvoiceGenerator {
  static async generateInvoiceBuffer(order: IOrder): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: "A4" });
        const buffers: Buffer[] = [];
        doc.on("data", (buffer) => buffers.push(buffer));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        // Helper to format price correctly for PDF
        const pdfPrice = (amount: number) => amount.toFixed(2);

        // --- COLORS & STYLES ---
        const borderColor = "#9ca3af";
        const headerBgColor = "#f3f4f6";
        const textColor = "#111827";

        // --- HEADER ROW (Logo & Company Details) ---
        const logoPath = path.resolve(process.cwd(), '../frontend/public/Store4riders-Logo.jpg');
        if (fs.existsSync(logoPath)) {
          // Reduced size further to prevent overlap
          doc.image(logoPath, 40, 40, { width: 110 });
        }
        
        doc.fontSize(26).font("Helvetica-Bold").fillColor(textColor).text("TAX INVOICE", { align: "right" });
        
        // Shifted Sold By down to avoid logo overlap
        doc.fontSize(9).font("Helvetica-Bold").text("SOLD BY / DISPATCHED FROM:", 40, 85);
        doc.font("Helvetica").text("Store4Riders, 123 Rider Street", 40, 97);
        doc.text("Moto City, Maharashtra - 411001", 40, 109);
        doc.text("GSTIN: 27AAAAA0000A1Z5", 40, 121);
        
        doc.moveDown(2);

        // --- TOP INFO BOXES ---
        // Shifted top boxes down to accommodate the header
        let currentY = 150;
        const startX = 40;
        const fullWidth = 515;
        const col1Width = 220;
        const col2Width = 140;
        const col3Width = 155;

        // Draw top boxes border
        doc.rect(startX, currentY, fullWidth, 80).strokeColor(borderColor).stroke();
        doc.moveTo(startX + col1Width, currentY).lineTo(startX + col1Width, currentY + 80).stroke();
        doc.moveTo(startX + col1Width + col2Width, currentY).lineTo(startX + col1Width + col2Width, currentY + 80).stroke();

        // Box 1: BILL TO
        doc.fontSize(9).font("Helvetica-Bold").text("BILL TO:", startX + 10, currentY + 10);
        doc.font("Helvetica").text(order.shippingAddress.fullName, startX + 10, currentY + 25);
        doc.text(order.shippingAddress.addressLine1, startX + 10, currentY + 38);
        const cityState = `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`;
        doc.text(cityState, startX + 10, currentY + 51);
        doc.text(`Phone: ${order.shippingAddress.phone}`, startX + 10, currentY + 64);

        // Box 2: INVOICE / ORDER ID
        doc.font("Helvetica-Bold").text("INVOICE NO:", startX + col1Width + 10, currentY + 10);
        const invoiceNo = `INV-${new Date().getFullYear()}-${order.orderNumber?.slice(-5) || "000"}`;
        doc.font("Helvetica").text(invoiceNo, startX + col1Width + 10, currentY + 25);
        
        doc.font("Helvetica-Bold").text("ORDER ID:", startX + col1Width + 10, currentY + 45);
        doc.font("Helvetica").text(`#${order.orderNumber || order.id}`, startX + col1Width + 10, currentY + 60);

        // Box 3: DATE / STATE
        doc.font("Helvetica-Bold").text("DATE:", startX + col1Width + col2Width + 10, currentY + 10);
        doc.font("Helvetica").text(new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), startX + col1Width + col2Width + 45, currentY + 10);
        
        doc.font("Helvetica-Bold").text("STATE:", startX + col1Width + col2Width + 10, currentY + 30);
        doc.font("Helvetica").text(order.shippingAddress.state, startX + col1Width + col2Width + 50, currentY + 30);
        
        doc.font("Helvetica-Bold").text("PLACE OF SUPPLY:", startX + col1Width + col2Width + 10, currentY + 50);
        doc.font("Helvetica").text(order.shippingAddress.state, startX + col1Width + col2Width + 10, currentY + 65);

        currentY += 85;

        // --- TABLE HEADER ---
        doc.rect(startX, currentY, fullWidth, 25).fillAndStroke(headerBgColor, borderColor);
        
        // Exact Column X Coordinates to perfectly fit 515 width
        const cols = {
          sr: 40,
          desc: 70,    // +30 width
          qty: 235,    // +165 width
          rate: 265,   // +30 width
          disc: 315,   // +50 width
          taxVal: 360, // +45 width
          cgst: 415,   // +55 width
          sgst: 460,   // +45 width
          total: 505   // +45 width, total width 50
        };

        const drawVerticalLines = (yStart: number, yEnd: number) => {
          [cols.desc, cols.qty, cols.rate, cols.disc, cols.taxVal, cols.cgst, cols.sgst, cols.total].forEach(x => {
            doc.moveTo(x, yStart).lineTo(x, yEnd).strokeColor(borderColor).stroke();
          });
          doc.moveTo(startX, yStart).lineTo(startX, yEnd).stroke();
          doc.moveTo(startX + fullWidth, yStart).lineTo(startX + fullWidth, yEnd).stroke();
        };

        drawVerticalLines(currentY, currentY + 25);

        doc.fillColor(textColor).fontSize(8).font("Helvetica-Bold");
        doc.text("SR", cols.sr, currentY + 8, { width: 30, align: "center" });
        doc.text("ITEM DESCRIPTION", cols.desc + 5, currentY + 8);
        doc.text("QTY", cols.qty, currentY + 8, { width: 30, align: "center" });
        doc.text("RATE (Rs)", cols.rate, currentY + 8, { width: 50, align: "center" });
        doc.text("DISC", cols.disc, currentY + 8, { width: 45, align: "center" });
        doc.text("TAX VAL", cols.taxVal, currentY + 8, { width: 55, align: "center" });
        doc.text("CGST", cols.cgst, currentY + 8, { width: 45, align: "center" });
        doc.text("SGST", cols.sgst, currentY + 8, { width: 45, align: "center" });
        doc.text("TOTAL", cols.total, currentY + 8, { width: 50, align: "center" });

        currentY += 25;
        doc.moveTo(startX, currentY).lineTo(startX + fullWidth, currentY).stroke();

        // --- TABLE ROWS ---
        let totalTaxable = 0;
        let totalCgst = 0;
        let totalSgst = 0;
        
        doc.font("Helvetica").fontSize(8);
        
        // Loop through items
        order.items.forEach((item, i) => {
          const rowHeight = 25;
          const rate = item.unitPrice;
          const qty = item.quantity;
          const discount = 0; 
          const taxVal = (rate - discount) * qty;
          
          const gstPercent = (item as any).taxRate || order.pricing.taxRate || 18;
          const taxAmt = (item as any).taxAmount || (taxVal * (gstPercent / 100));
          const cgst = taxAmt / 2;
          const sgst = taxAmt / 2;
          const totalAmt = taxVal + taxAmt;

          totalTaxable += taxVal;
          totalCgst += cgst;
          totalSgst += sgst;

          doc.text(`${i + 1}`, cols.sr, currentY + 8, { width: 30, align: "center" });
          doc.text(`${item.name} (HSN: 8708)`, cols.desc + 5, currentY + 8, { width: 160, height: 12, ellipsis: true });
          doc.text(`${qty} NOS`, cols.qty, currentY + 8, { width: 30, align: "center" });
          doc.text(pdfPrice(rate), cols.rate, currentY + 8, { width: 45, align: "right" });
          doc.text(pdfPrice(discount), cols.disc, currentY + 8, { width: 40, align: "right" });
          doc.text(pdfPrice(taxVal), cols.taxVal, currentY + 8, { width: 50, align: "right" });
          doc.text(pdfPrice(cgst) + ` (${gstPercent/2}%)`, cols.cgst, currentY + 8, { width: 40, align: "right" });
          doc.text(pdfPrice(sgst) + ` (${gstPercent/2}%)`, cols.sgst, currentY + 8, { width: 40, align: "right" });
          doc.text(pdfPrice(totalAmt), cols.total, currentY + 8, { width: 45, align: "right" });

          drawVerticalLines(currentY, currentY + rowHeight);
          currentY += rowHeight;
          doc.moveTo(startX, currentY).lineTo(startX + fullWidth, currentY).strokeColor("#e5e7eb").stroke();
        });

        // Add Shipping as a line item if there is a shipping cost
        if (order.pricing.shipping > 0) {
          const rowHeight = 25;
          const rate = order.pricing.shipping;
          const taxVal = rate;
          const cgst = 0; 
          const sgst = 0;
          const totalAmt = taxVal;
          
          totalTaxable += taxVal;

          doc.text(`${order.items.length + 1}`, cols.sr, currentY + 8, { width: 30, align: "center" });
          doc.text(`Shipping & Handling (HSN: 9968)`, cols.desc + 5, currentY + 8, { width: 160, height: 12, ellipsis: true });
          doc.text(`1 NOS`, cols.qty, currentY + 8, { width: 30, align: "center" });
          doc.text(pdfPrice(rate), cols.rate, currentY + 8, { width: 45, align: "right" });
          doc.text(pdfPrice(0), cols.disc, currentY + 8, { width: 40, align: "right" });
          doc.text(pdfPrice(taxVal), cols.taxVal, currentY + 8, { width: 50, align: "right" });
          doc.text(pdfPrice(cgst), cols.cgst, currentY + 8, { width: 40, align: "right" });
          doc.text(pdfPrice(sgst), cols.sgst, currentY + 8, { width: 40, align: "right" });
          doc.text(pdfPrice(totalAmt), cols.total, currentY + 8, { width: 45, align: "right" });

          drawVerticalLines(currentY, currentY + rowHeight);
          currentY += rowHeight;
          doc.moveTo(startX, currentY).lineTo(startX + fullWidth, currentY).strokeColor("#e5e7eb").stroke();
        }

        // --- TOTALS SECTION ---
        doc.rect(startX, currentY, fullWidth, 40).fillAndStroke(headerBgColor, borderColor);
        
        // Horizontal divider inside totals
        doc.moveTo(startX, currentY + 20).lineTo(startX + fullWidth, currentY + 20).strokeColor(borderColor).stroke();

        doc.fillColor(textColor).fontSize(9).font("Helvetica-Bold");
        
        // Row 1 (Taxable + SGST)
        doc.text("TOTAL TAXABLE VALUE:", startX + 10, currentY + 6);
        doc.text(`Rs. ${pdfPrice(totalTaxable)}`, startX + 140, currentY + 6);
        
        doc.text("TOTAL SGST:", startX + 240, currentY + 6);
        doc.text(`Rs. ${pdfPrice(totalSgst)}`, startX + 320, currentY + 6);

        // Row 2 (CGST + Grand Total)
        doc.text("TOTAL CGST:", startX + 10, currentY + 26);
        doc.text(`Rs. ${pdfPrice(totalCgst)}`, startX + 140, currentY + 26);
        
        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("GRAND TOTAL:", startX + 350, currentY + 26);
        
        const finalTotal = order.pricing.total || (totalTaxable + totalCgst + totalSgst - order.pricing.discount);
        doc.text(`Rs. ${pdfPrice(finalTotal)}`, startX + 430, currentY + 26, { width: 75, align: "right" });

        currentY += 40;

        // --- GRAND TOTAL IN WORDS ---
        doc.rect(startX, currentY, fullWidth, 20).strokeColor(borderColor).stroke();
        doc.fontSize(9).font("Helvetica-Bold").fillColor(textColor);
        doc.text(`GRAND TOTAL IN WORDS: ${numberToWords(finalTotal)}`, startX + 10, currentY + 6);
        currentY += 20;

        // --- FOOTER SECTION (Payment & Terms) ---
        doc.rect(startX, currentY, fullWidth, 50).strokeColor(borderColor).stroke();
        
        doc.fontSize(8).font("Helvetica-Bold").text("PAYMENT DETAILS: ", startX + 10, currentY + 10, { continued: true });
        doc.font("Helvetica").text(`Method: ${order.paymentMethod.toUpperCase()}, Status: ${order.status.toUpperCase()}, Paid: Rs. ${pdfPrice(finalTotal)}`);
        
        doc.font("Helvetica-Bold").text("TERMS & CONDITIONS: ", startX + 10, currentY + 25, { continued: true });
        doc.font("Helvetica").text(`1. Returns accepted within 7 days of delivery. 2. Warranty claims as per manufacturer policy. 3. E & OE.`);
        
        doc.text(`Store4Riders | GSTIN: 27AAAAA0000A1Z5`, startX + 10, currentY + 40);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

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
