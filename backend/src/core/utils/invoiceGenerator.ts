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
    const { SettingRepository } = await import("../../modules/settings/setting.repository");
    const settings = await SettingRepository.getSettings();
    const storeName = settings.legalBusinessName || "Store4Riders";
    const storeAddress = settings.storeOriginAddress || "Warehouse";
    const storeCity = settings.storeOriginCity || "Pune";
    const storeState = (settings.storeOriginState || "Maharashtra").trim();
    const storePin = settings.storeOriginPincode || "411001";
    const storeGstin = settings.gstin || "Unregistered / In Progress";

    const buyerState = (order.shippingAddress?.state || "").trim().toLowerCase();
    const isInterState = buyerState !== "" && storeState !== "" && buyerState !== storeState.toLowerCase();

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
        
        // Sold By / Origin from Settings
        doc.fontSize(9).font("Helvetica-Bold").text("SOLD BY / DISPATCHED FROM:", 40, 85);
        doc.font("Helvetica").text(`${storeName}, ${storeAddress}`, 40, 97);
        doc.text(`${storeCity}, ${storeState} - ${storePin}`, 40, 109);
        doc.text(`GSTIN: ${storeGstin}`, 40, 121);
        
        doc.moveDown(2);

        // --- TOP INFO BOXES ---
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
        doc.fontSize(9).font("Helvetica-Bold").text("BILL TO:", startX + 10, currentY + 8);
        doc.font("Helvetica").fontSize(8.5).text(order.shippingAddress.fullName, startX + 10, currentY + 21);
        
        let billToY = currentY + 33;
        if (order.businessName) {
          doc.font("Helvetica-Bold").fontSize(7.5).text(`Company: ${order.businessName}`, startX + 10, billToY);
          billToY += 10;
        }
        if (order.customerGstin) {
          doc.font("Helvetica-Bold").fontSize(7.5).text(`Buyer GSTIN: ${order.customerGstin}`, startX + 10, billToY);
          billToY += 10;
        }
        doc.font("Helvetica").fontSize(8).text(order.shippingAddress.addressLine1, startX + 10, billToY, { width: 200, height: 10, ellipsis: true });
        billToY += 10;
        const cityState = `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`;
        doc.text(cityState, startX + 10, billToY);
        doc.text(`Phone: ${order.shippingAddress.phone}`, startX + 10, billToY + 10);

        // Box 2: INVOICE / ORDER ID
        doc.font("Helvetica-Bold").fontSize(9).text("INVOICE NO:", startX + col1Width + 10, currentY + 10);
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
        
        // Exact Column X Coordinates
        const cols = isInterState ? {
          sr: 40,
          desc: 70,
          qty: 235,
          rate: 265,
          disc: 315,
          taxVal: 360,
          cgst: 415, // Used as IGST column
          sgst: 460, // Unused spacer
          total: 480
        } : {
          sr: 40,
          desc: 70,
          qty: 235,
          rate: 265,
          disc: 315,
          taxVal: 360,
          cgst: 415,
          sgst: 460,
          total: 505
        };

        const drawVerticalLines = (yStart: number, yEnd: number) => {
          if (isInterState) {
            [cols.desc, cols.qty, cols.rate, cols.disc, cols.taxVal, cols.cgst, cols.total].forEach(x => {
              doc.moveTo(x, yStart).lineTo(x, yEnd).strokeColor(borderColor).stroke();
            });
          } else {
            [cols.desc, cols.qty, cols.rate, cols.disc, cols.taxVal, cols.cgst, cols.sgst, cols.total].forEach(x => {
              doc.moveTo(x, yStart).lineTo(x, yEnd).strokeColor(borderColor).stroke();
            });
          }
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
        if (isInterState) {
          doc.text("IGST", cols.cgst, currentY + 8, { width: 65, align: "center" });
          doc.text("TOTAL", cols.total, currentY + 8, { width: 75, align: "center" });
        } else {
          doc.text("CGST", cols.cgst, currentY + 8, { width: 45, align: "center" });
          doc.text("SGST", cols.sgst, currentY + 8, { width: 45, align: "center" });
          doc.text("TOTAL", cols.total, currentY + 8, { width: 50, align: "center" });
        }

        currentY += 25;
        doc.moveTo(startX, currentY).lineTo(startX + fullWidth, currentY).stroke();

        // --- TABLE ROWS ---
        let totalTaxable = 0;
        let totalCgst = 0;
        let totalSgst = 0;
        let totalIgst = 0;
        
        doc.font("Helvetica").fontSize(8);
        
        // Loop through items
        order.items.forEach((item, i) => {
          const rowHeight = 25;
          const rate = item.unitPrice;
          const qty = item.quantity;
          const totalOrderDiscount = (order.pricing.couponDiscount || 0) + (order.pricing.discount || 0);
          const itemSubtotal = rate * qty;
          const discount = (order.pricing.subtotal > 0 && totalOrderDiscount > 0)
            ? Math.round((itemSubtotal / order.pricing.subtotal) * totalOrderDiscount * 100) / 100
            : 0;
          const gstPercent = item.taxRate ?? (order.pricing.taxRate ?? 18);
          
          // If pricing is inclusive:
          const isInclusive = settings.gstPricingMode !== "exclusive";
          let taxVal = (rate * qty) - discount;
          let taxAmt = item.taxAmount !== undefined
            ? (discount > 0 && itemSubtotal > 0 ? Math.round(item.taxAmount * (1 - discount / itemSubtotal) * 100) / 100 : item.taxAmount)
            : (taxVal * (gstPercent / 100));
          let totalAmt = taxVal + (isInclusive ? 0 : taxAmt);

          if (isInclusive) {
            taxVal = totalAmt - taxAmt;
          }

          const hsnCode = item.hsnCode || "6506";

          totalTaxable += taxVal;
          if (isInterState) {
            totalIgst += taxAmt;
          } else {
            const cgst = taxAmt / 2;
            const sgst = taxAmt / 2;
            totalCgst += cgst;
            totalSgst += sgst;
          }

          doc.text(`${i + 1}`, cols.sr, currentY + 8, { width: 30, align: "center" });
          doc.text(`${item.name} (HSN: ${hsnCode})`, cols.desc + 5, currentY + 8, { width: 160, height: 12, ellipsis: true });
          doc.text(`${qty} NOS`, cols.qty, currentY + 8, { width: 30, align: "center" });
          doc.text(pdfPrice(rate), cols.rate, currentY + 8, { width: 45, align: "right" });
          doc.text(pdfPrice(discount), cols.disc, currentY + 8, { width: 40, align: "right" });
          doc.text(pdfPrice(taxVal), cols.taxVal, currentY + 8, { width: 50, align: "right" });

          if (isInterState) {
            doc.text(pdfPrice(taxAmt) + ` (${gstPercent}%)`, cols.cgst, currentY + 8, { width: 60, align: "right" });
            doc.text(pdfPrice(totalAmt), cols.total, currentY + 8, { width: 70, align: "right" });
          } else {
            const cgst = taxAmt / 2;
            const sgst = taxAmt / 2;
            doc.text(pdfPrice(cgst) + ` (${gstPercent/2}%)`, cols.cgst, currentY + 8, { width: 40, align: "right" });
            doc.text(pdfPrice(sgst) + ` (${gstPercent/2}%)`, cols.sgst, currentY + 8, { width: 40, align: "right" });
            doc.text(pdfPrice(totalAmt), cols.total, currentY + 8, { width: 45, align: "right" });
          }

          drawVerticalLines(currentY, currentY + rowHeight);
          currentY += rowHeight;
          doc.moveTo(startX, currentY).lineTo(startX + fullWidth, currentY).strokeColor("#e5e7eb").stroke();
        });

        // Add Shipping as a line item if there is a shipping cost
        if (order.pricing.shipping > 0) {
          const rowHeight = 25;
          const rate = order.pricing.shipping;
          const taxVal = rate;
          const totalAmt = taxVal;
          
          totalTaxable += taxVal;

          doc.text(`${order.items.length + 1}`, cols.sr, currentY + 8, { width: 30, align: "center" });
          doc.text(`Shipping & Handling (HSN: 9968)`, cols.desc + 5, currentY + 8, { width: 160, height: 12, ellipsis: true });
          doc.text(`1 NOS`, cols.qty, currentY + 8, { width: 30, align: "center" });
          doc.text(pdfPrice(rate), cols.rate, currentY + 8, { width: 45, align: "right" });
          doc.text(pdfPrice(0), cols.disc, currentY + 8, { width: 40, align: "right" });
          doc.text(pdfPrice(taxVal), cols.taxVal, currentY + 8, { width: 50, align: "right" });

          if (isInterState) {
            doc.text(pdfPrice(0), cols.cgst, currentY + 8, { width: 60, align: "right" });
            doc.text(pdfPrice(totalAmt), cols.total, currentY + 8, { width: 70, align: "right" });
          } else {
            doc.text(pdfPrice(0), cols.cgst, currentY + 8, { width: 40, align: "right" });
            doc.text(pdfPrice(0), cols.sgst, currentY + 8, { width: 40, align: "right" });
            doc.text(pdfPrice(totalAmt), cols.total, currentY + 8, { width: 45, align: "right" });
          }

          drawVerticalLines(currentY, currentY + rowHeight);
          currentY += rowHeight;
          doc.moveTo(startX, currentY).lineTo(startX + fullWidth, currentY).strokeColor("#e5e7eb").stroke();
        }

        // --- TOTALS SECTION ---
        doc.rect(startX, currentY, fullWidth, 40).fillAndStroke(headerBgColor, borderColor);
        
        // Horizontal divider inside totals
        doc.moveTo(startX, currentY + 20).lineTo(startX + fullWidth, currentY + 20).strokeColor(borderColor).stroke();

        doc.fillColor(textColor).fontSize(9).font("Helvetica-Bold");
        
        if (isInterState) {
          doc.text("TOTAL TAXABLE VALUE:", startX + 10, currentY + 6);
          doc.text(`Rs. ${pdfPrice(totalTaxable)}`, startX + 140, currentY + 6);
          
          doc.text("TOTAL IGST:", startX + 240, currentY + 6);
          doc.text(`Rs. ${pdfPrice(totalIgst)}`, startX + 320, currentY + 6);
        } else {
          doc.text("TOTAL TAXABLE VALUE:", startX + 10, currentY + 6);
          doc.text(`Rs. ${pdfPrice(totalTaxable)}`, startX + 140, currentY + 6);
          
          doc.text("TOTAL SGST:", startX + 240, currentY + 6);
          doc.text(`Rs. ${pdfPrice(totalSgst)}`, startX + 320, currentY + 6);

          doc.text("TOTAL CGST:", startX + 10, currentY + 26);
          doc.text(`Rs. ${pdfPrice(totalCgst)}`, startX + 140, currentY + 26);
        }
        
        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("GRAND TOTAL:", startX + 350, currentY + 26);
        
        const finalTotal = order.pricing.total || (totalTaxable + (isInterState ? totalIgst : (totalCgst + totalSgst)) - order.pricing.discount);
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
        
        doc.text(`${storeName} | GSTIN: ${storeGstin}`, startX + 10, currentY + 40);

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
