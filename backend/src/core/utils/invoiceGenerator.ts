import PDFDocument from "pdfkit";
import { IOrder } from "@store4riders/shared-types";
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

/**
 * Normalizes Indian state names and common abbreviations to accurately compare
 * dispatch warehouse state against customer destination state for Indian GST (CGST+SGST vs IGST).
 */
export function normalizeIndianState(state: string | undefined): string {
  if (!state) return "";
  let s = state.trim().toLowerCase();
  // Strip common words and non-alphanumeric chars
  s = s.replace(/\b(state|ut|union territory)\b/gi, "").replace(/[^a-z0-9]/g, "").trim();

  const aliases: Record<string, string> = {
    mh: "maharashtra",
    maharashtra: "maharashtra",
    wb: "westbengal",
    westbengal: "westbengal",
    bengal: "westbengal",
    br: "bihar",
    bihar: "bihar",
    jh: "jharkhand",
    jharkhand: "jharkhand",
    dl: "delhi",
    delhi: "delhi",
    newdelhi: "delhi",
    nctofdelhi: "delhi",
    ka: "karnataka",
    karnataka: "karnataka",
    tn: "tamilnadu",
    tamilnadu: "tamilnadu",
    gj: "gujarat",
    gujarat: "gujarat",
    up: "uttarpradesh",
    uttarpradesh: "uttarpradesh",
    rj: "rajasthan",
    rajasthan: "rajasthan",
    pb: "punjab",
    punjab: "punjab",
    hr: "haryana",
    haryana: "haryana",
    kl: "kerala",
    kerala: "kerala",
    ts: "telangana",
    tg: "telangana",
    telangana: "telangana",
    ap: "andhrapradesh",
    andhrapradesh: "andhrapradesh",
    mp: "madhyapradesh",
    madhyapradesh: "madhyapradesh",
    or: "odisha",
    od: "odisha",
    orissa: "odisha",
    odisha: "odisha",
    as: "assam",
    assam: "assam",
    ga: "goa",
    goa: "goa",
    uk: "uttarakhand",
    ua: "uttarakhand",
    uttaranchal: "uttarakhand",
    uttarakhand: "uttarakhand",
    hp: "himachalpradesh",
    himachalpradesh: "himachalpradesh",
    jk: "jammukashmir",
    jammukashmir: "jammukashmir",
    jammuandkashmir: "jammukashmir",
    ch: "chandigarh",
    chandigarh: "chandigarh",
    cg: "chhattisgarh",
    chhattisgarh: "chhattisgarh",
  };

  return aliases[s] || s;
}

export class InvoiceGenerator {
  static async generateInvoiceBuffer(order: IOrder): Promise<Buffer> {
    const { SettingRepository } = await import("../../modules/settings/setting.repository");
    const settings = await SettingRepository.getSettings();

    // 1. Resolve Warehouse (Order warehouse > Shipment warehouse > Default warehouse > First warehouse > Settings)
    let warehouse: any = null;

    if ((order as any).warehouseId) {
      try {
        const { WarehouseRepository } = await import("../../modules/warehouse/warehouse.repository");
        warehouse = await WarehouseRepository.findById((order as any).warehouseId);
      } catch {}
    }

    if (!warehouse) {
      try {
        const { ShipmentRepository } = await import("../../modules/shipping/shipment.repository");
        const { WarehouseRepository } = await import("../../modules/warehouse/warehouse.repository");
        const shipments = await ShipmentRepository.findByOrderId(String((order as any)._id || order.id));
        const shipmentWithWh = shipments?.find((s: any) => s.warehouseId);
        if (shipmentWithWh && (shipmentWithWh as any).warehouseId) {
          warehouse = await WarehouseRepository.findById((shipmentWithWh as any).warehouseId);
        }
      } catch {}
    }

    if (!warehouse) {
      try {
        const { WarehouseRepository } = await import("../../modules/warehouse/warehouse.repository");
        warehouse = await WarehouseRepository.findDefault();
      } catch {}
    }

    if (!warehouse) {
      try {
        const { WarehouseRepository } = await import("../../modules/warehouse/warehouse.repository");
        const allWarehouses = await WarehouseRepository.findAll();
        if (allWarehouses && allWarehouses.length > 0) {
          warehouse = allWarehouses[0];
        }
      } catch {}
    }

    // Origin dispatch details
    const storeLegalName = settings.legalBusinessName || "Store4Riders";
    const warehouseDisplayName = warehouse?.name ? `${storeLegalName} (${warehouse.name})` : storeLegalName;
    const storeAddress = warehouse?.addressLine1
      ? `${warehouse.addressLine1}${warehouse.addressLine2 ? ", " + warehouse.addressLine2 : ""}`
      : (settings.storeOriginAddress || "Central Warehouse");
    const storeCity = warehouse?.city || settings.storeOriginCity || "Pune";
    const storeState = (warehouse?.state || settings.storeOriginState || "Maharashtra").trim();
    const storePin = warehouse?.pincode || settings.storeOriginPincode || "411001";
    const storePhone = warehouse?.phone || settings.storeOriginPhone || "";
    const storeGstin = (warehouse as any)?.gstin || settings.gstin || "Unregistered / In Progress";

    // 2. GST State & Place of Supply Comparison
    const buyerState = (order.shippingAddress?.state || "").trim();
    const normalizedOriginState = normalizeIndianState(storeState);
    const normalizedBuyerState = normalizeIndianState(buyerState);
    const isInterState = normalizedOriginState !== "" && normalizedBuyerState !== "" && normalizedOriginState !== normalizedBuyerState;

    // Resolve Dynamic GST Tax Rate (Handles 0%, 5%, 12%, 18%, 28%, or future rates from Settings/Order)
    const dynamicTaxRate = typeof order.pricing?.taxRate === "number"
      ? order.pricing.taxRate
      : (typeof settings.taxRate === "number" ? settings.taxRate : 18);
    const halfTaxRate = dynamicTaxRate > 0 ? (dynamicTaxRate / 2) : 0;
    const igstRateStr = dynamicTaxRate % 1 === 0 ? `${dynamicTaxRate}%` : `${dynamicTaxRate.toFixed(1)}%`;
    const halfRateStr = halfTaxRate % 1 === 0 ? `${halfTaxRate}%` : `${halfTaxRate.toFixed(1)}%`;

    // 3. Payment Details & Cash on Delivery (COD) Breakdown
    const isCod = String(order.paymentMethod || "").toLowerCase() === "cod";
    const orderStatus = String(order.status || "").toLowerCase();
    const isDelivered = orderStatus === "delivered";
    const totalOrderAmount = order.pricing?.total ?? 0;
    const advancePaid = isCod ? (order.pricing?.codPartialPaymentAmount || 0) : totalOrderAmount;
    const balanceCodPending = isCod
      ? (order.pricing?.codAmountToCollect !== undefined
          ? order.pricing.codAmountToCollect
          : Math.max(0, totalOrderAmount - advancePaid))
      : 0;
    const balanceCodToCollect = isDelivered ? 0 : balanceCodPending;
    const balanceCodCollected = isDelivered ? balanceCodPending : 0;

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: "A4" });
        const buffers: Buffer[] = [];
        doc.on("data", (buffer) => buffers.push(buffer));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        const pdfPrice = (amount: number) => amount.toFixed(2);

        // --- PALETTE & STYLES ---
        const borderColor = "#cbd5e1"; // Slate 300
        const headerBgColor = "#f8fafc"; // Slate 50
        const tableHeaderBg = "#f1f5f9"; // Slate 100
        const textColor = "#0f172a"; // Slate 900
        const mutedTextColor = "#475569"; // Slate 600
        const brandRed = "#ab1509";
        const codHighlightColor = "#b91c1c"; // Red 700 for COD cash alert

        // --- 1. HEADER ROW (Logo & Title) ---
        const logoPath = path.resolve(process.cwd(), '../frontend/public/Store4riders-Logo.jpg');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 40, 35, { width: 105 });
        }
        
        doc.fontSize(22).font("Helvetica-Bold").fillColor(textColor).text("TAX INVOICE", 40, 35, { align: "right" });
        doc.fontSize(8).font("Helvetica").fillColor(mutedTextColor).text("Original for Recipient", 40, 60, { align: "right" });

        // SOLD BY / DISPATCH WAREHOUSE
        doc.fontSize(8.5).font("Helvetica-Bold").fillColor(textColor).text("SOLD BY / DISPATCHED FROM:", 40, 75);
        doc.font("Helvetica-Bold").fontSize(8).text(warehouseDisplayName, 40, 87);
        doc.font("Helvetica").fontSize(7.5).fillColor(mutedTextColor).text(storeAddress, 40, 97, { width: 250 });
        doc.text(`${storeCity}, ${storeState} - ${storePin}${storePhone ? ` | Phone: ${storePhone}` : ""}`, 40, 107);
        doc.font("Helvetica-Bold").fillColor(textColor).text(`GSTIN: ${storeGstin}`, 40, 117);

        // --- 2. TOP INFO BOX (Bill To | Invoice Details | Supply & Dispatch) ---
        const startX = 40;
        let currentY = 132;
        const fullWidth = 515;
        const col1Width = 205; // Bill To
        const col2Width = 150; // Invoice Details
        const col3Width = 160; // Place of Supply & Dispatch
        const topBoxHeight = 74;

        doc.rect(startX, currentY, fullWidth, topBoxHeight).strokeColor(borderColor).stroke();
        doc.moveTo(startX + col1Width, currentY).lineTo(startX + col1Width, currentY + topBoxHeight).stroke();
        doc.moveTo(startX + col1Width + col2Width, currentY).lineTo(startX + col1Width + col2Width, currentY + topBoxHeight).stroke();

        // Box 1: BILL TO / SHIP TO
        doc.fontSize(8).font("Helvetica-Bold").fillColor(textColor).text("BILL TO / SHIP TO:", startX + 8, currentY + 6);
        doc.font("Helvetica-Bold").fontSize(8).text(order.shippingAddress.fullName, startX + 8, currentY + 18);
        
        let billToY = currentY + 29;
        if (order.businessName) {
          doc.font("Helvetica-Bold").fontSize(7).fillColor(brandRed).text(`Co: ${order.businessName}`, startX + 8, billToY, { width: 190, ellipsis: true });
          billToY += 9;
        }
        if (order.customerGstin) {
          doc.font("Helvetica-Bold").fontSize(7).fillColor(brandRed).text(`Buyer GSTIN: ${order.customerGstin}`, startX + 8, billToY);
          billToY += 9;
        }
        doc.font("Helvetica").fontSize(7.5).fillColor(mutedTextColor).text(order.shippingAddress.addressLine1, startX + 8, billToY, { width: 190, height: 9, ellipsis: true });
        billToY += 9;
        doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, startX + 8, billToY);
        doc.text(`Phone: ${order.shippingAddress.phone}`, startX + 8, billToY + 9);

        // Box 2: INVOICE & ORDER DETAILS
        doc.font("Helvetica-Bold").fontSize(8).fillColor(textColor).text("INVOICE NO:", startX + col1Width + 8, currentY + 6);
        const invoiceNo = `INV-${new Date(order.createdAt).getFullYear()}-${order.orderNumber?.slice(-5) || "00001"}`;
        doc.font("Helvetica").fontSize(8).text(invoiceNo, startX + col1Width + 8, currentY + 17);

        doc.font("Helvetica-Bold").text("ORDER ID:", startX + col1Width + 8, currentY + 30);
        doc.font("Helvetica").text(`#${order.orderNumber || order.id}`, startX + col1Width + 8, currentY + 41);

        doc.font("Helvetica-Bold").text("DATE:", startX + col1Width + 8, currentY + 53);
        doc.font("Helvetica").text(new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), startX + col1Width + 38, currentY + 53);

        // Box 3: DISPATCH & GST PLACE OF SUPPLY
        doc.font("Helvetica-Bold").fontSize(8).fillColor(textColor).text("DISPATCH FROM:", startX + col1Width + col2Width + 8, currentY + 6);
        doc.font("Helvetica").fontSize(7.5).fillColor(mutedTextColor).text(`${storeCity}, ${storeState}`, startX + col1Width + col2Width + 8, currentY + 17, { width: 145, ellipsis: true });

        doc.font("Helvetica-Bold").fontSize(8).fillColor(textColor).text("PLACE OF SUPPLY:", startX + col1Width + col2Width + 8, currentY + 30);
        doc.font("Helvetica").fontSize(7.5).fillColor(mutedTextColor).text(order.shippingAddress.state, startX + col1Width + col2Width + 8, currentY + 41);

        doc.font("Helvetica-Bold").fontSize(8).fillColor(textColor).text("TAX REGIME:", startX + col1Width + col2Width + 8, currentY + 53);
        const regimeText = dynamicTaxRate === 0
          ? (isInterState ? "Inter-State (0% Exempt)" : "Intra-State (0% Exempt)")
          : (isInterState ? `Inter-State (IGST ${igstRateStr})` : `Intra-State (CGST ${halfRateStr} + SGST ${halfRateStr})`);
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor(dynamicTaxRate === 0 ? textColor : (isInterState ? brandRed : "#15803d")).text(
          regimeText,
          startX + col1Width + col2Width + 8,
          currentY + 63
        );

        currentY += 80;

        // --- 3. ITEMS TABLE HEADER ---
        const tableHeaderHeight = 20;
        doc.rect(startX, currentY, fullWidth, tableHeaderHeight).fillAndStroke(tableHeaderBg, borderColor);

        const cols = isInterState ? {
          sr: 40,
          desc: 65,
          qty: 240,
          rate: 275,
          disc: 320,
          taxVal: 360,
          cgst: 415, // Used as IGST column in inter-state
          sgst: 460, // Not used in inter-state
          total: 480
        } : {
          sr: 40,
          desc: 65,
          qty: 225,
          rate: 256,
          disc: 298,
          taxVal: 340,
          cgst: 395,
          sgst: 448,
          total: 492
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

        drawVerticalLines(currentY, currentY + tableHeaderHeight);

        doc.fillColor(textColor).fontSize(7.5).font("Helvetica-Bold");
        doc.text("SR", cols.sr, currentY + 6, { width: cols.desc - cols.sr, align: "center" });
        doc.text("ITEM DESCRIPTION & HSN", cols.desc + 4, currentY + 6);
        doc.text("QTY", cols.qty, currentY + 6, { width: cols.rate - cols.qty, align: "center" });
        doc.text("RATE (Rs)", cols.rate, currentY + 6, { width: cols.disc - cols.rate - 4, align: "right" });
        doc.text("DISC", cols.disc, currentY + 6, { width: cols.taxVal - cols.disc - 4, align: "right" });
        doc.text("TAX VAL", cols.taxVal, currentY + 6, { width: (isInterState ? cols.cgst : cols.cgst) - cols.taxVal - 4, align: "right" });

        if (isInterState) {
          doc.text(`IGST (${igstRateStr})`, cols.cgst, currentY + 6, { width: cols.total - cols.cgst - 4, align: "right" });
          doc.text("TOTAL", cols.total, currentY + 6, { width: startX + fullWidth - cols.total - 4, align: "right" });
        } else {
          doc.text(`CGST (${halfRateStr})`, cols.cgst, currentY + 6, { width: cols.sgst - cols.cgst - 4, align: "right" });
          doc.text(`SGST (${halfRateStr})`, cols.sgst, currentY + 6, { width: cols.total - cols.sgst - 4, align: "right" });
          doc.text("TOTAL", cols.total, currentY + 6, { width: startX + fullWidth - cols.total - 4, align: "right" });
        }

        currentY += tableHeaderHeight;
        doc.moveTo(startX, currentY).lineTo(startX + fullWidth, currentY).stroke();

        // --- 4. TABLE ROWS (DYNAMIC EXPANSION - NO TRUNCATION) ---
        let totalTaxable = 0;
        let totalCgst = 0;
        let totalSgst = 0;
        let totalIgst = 0;

        order.items.forEach((item, i) => {
          const rate = item.unitPrice;
          const qty = item.quantity;
          const totalOrderDiscount = (order.pricing?.couponDiscount || 0) + (order.pricing?.discount || 0);
          const itemSubtotal = rate * qty;
          const discount = (order.pricing?.subtotal > 0 && totalOrderDiscount > 0)
            ? Math.round((itemSubtotal / order.pricing.subtotal) * totalOrderDiscount * 100) / 100
            : 0;
          const gstPercent = typeof item.taxRate === "number" ? item.taxRate : dynamicTaxRate;
          
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

          // Measure actual height needed for product name
          const descWidth = (cols.qty - cols.desc) - 8;
          doc.font("Helvetica-Bold").fontSize(7.5);
          const nameHeight = doc.heightOfString(item.name, { width: descWidth, lineGap: 1 });
          const rowHeight = Math.max(26, Math.ceil(nameHeight + 14));

          // Draw vertical cell borders
          drawVerticalLines(currentY, currentY + rowHeight);

          // 1. SR Number
          doc.fillColor(textColor).font("Helvetica").fontSize(7.5);
          doc.text(`${i + 1}`, cols.sr, currentY + 5, { width: cols.desc - cols.sr, align: "center" });

          // 2. Product Name (Wrapped cleanly, never truncated)
          doc.font("Helvetica-Bold").fontSize(7.5).fillColor(textColor);
          doc.text(item.name, cols.desc + 4, currentY + 4, { width: descWidth, lineGap: 1 });
          const afterNameY = doc.y;

          // 3. Subtitle: HSN/SAC + SKU
          doc.font("Helvetica").fontSize(6.5).fillColor(mutedTextColor);
          const skuLabel = item.sku ? ` | SKU: ${item.sku}` : "";
          doc.text(`HSN: ${hsnCode}${skuLabel}`, cols.desc + 4, afterNameY + 1, { width: descWidth });

          // 4. Numerical Columns (Vertically aligned with top of item)
          const numY = currentY + 5;
          doc.font("Helvetica").fontSize(7.5).fillColor(textColor);
          doc.text(`${qty} NOS`, cols.qty, numY, { width: cols.rate - cols.qty, align: "center" });
          doc.text(pdfPrice(rate), cols.rate, numY, { width: cols.disc - cols.rate - 4, align: "right" });
          doc.text(pdfPrice(discount), cols.disc, numY, { width: cols.taxVal - cols.disc - 4, align: "right" });
          doc.text(pdfPrice(taxVal), cols.taxVal, numY, { width: (isInterState ? cols.cgst : cols.cgst) - cols.taxVal - 4, align: "right" });

          if (isInterState) {
            doc.text(pdfPrice(taxAmt), cols.cgst, numY, { width: cols.total - cols.cgst - 4, align: "right" });
            doc.text(pdfPrice(totalAmt), cols.total, numY, { width: startX + fullWidth - cols.total - 4, align: "right" });
          } else {
            const cgst = taxAmt / 2;
            const sgst = taxAmt / 2;
            doc.text(pdfPrice(cgst), cols.cgst, numY, { width: cols.sgst - cols.cgst - 4, align: "right" });
            doc.text(pdfPrice(sgst), cols.sgst, numY, { width: cols.total - cols.sgst - 4, align: "right" });
            doc.text(pdfPrice(totalAmt), cols.total, numY, { width: startX + fullWidth - cols.total - 4, align: "right" });
          }

          currentY += rowHeight;
          doc.moveTo(startX, currentY).lineTo(startX + fullWidth, currentY).strokeColor("#e2e8f0").stroke();
        });

        // Shipping Row if > 0
        if (order.pricing?.shipping && order.pricing.shipping > 0) {
          const shipRowHeight = 20;
          const rate = order.pricing.shipping;
          const taxVal = rate;
          const totalAmt = taxVal;
          totalTaxable += taxVal;

          drawVerticalLines(currentY, currentY + shipRowHeight);

          doc.fillColor(textColor).font("Helvetica").fontSize(7.5);
          doc.text(`${order.items.length + 1}`, cols.sr, currentY + 5, { width: cols.desc - cols.sr, align: "center" });
          
          doc.font("Helvetica-Bold").text(`Shipping & Delivery Charges`, cols.desc + 4, currentY + 3);
          doc.font("Helvetica").fontSize(6.5).fillColor(mutedTextColor).text(`HSN/SAC: 9968`, cols.desc + 4, currentY + 11);

          const numY = currentY + 5;
          doc.font("Helvetica").fontSize(7.5).fillColor(textColor);
          doc.text(`1 NOS`, cols.qty, numY, { width: cols.rate - cols.qty, align: "center" });
          doc.text(pdfPrice(rate), cols.rate, numY, { width: cols.disc - cols.rate - 4, align: "right" });
          doc.text(pdfPrice(0), cols.disc, numY, { width: cols.taxVal - cols.disc - 4, align: "right" });
          doc.text(pdfPrice(taxVal), cols.taxVal, numY, { width: (isInterState ? cols.cgst : cols.cgst) - cols.taxVal - 4, align: "right" });

          if (isInterState) {
            doc.text(pdfPrice(0), cols.cgst, numY, { width: cols.total - cols.cgst - 4, align: "right" });
            doc.text(pdfPrice(totalAmt), cols.total, numY, { width: startX + fullWidth - cols.total - 4, align: "right" });
          } else {
            doc.text(pdfPrice(0), cols.cgst, numY, { width: cols.sgst - cols.cgst - 4, align: "right" });
            doc.text(pdfPrice(0), cols.sgst, numY, { width: cols.total - cols.sgst - 4, align: "right" });
            doc.text(pdfPrice(totalAmt), cols.total, numY, { width: startX + fullWidth - cols.total - 4, align: "right" });
          }

          currentY += shipRowHeight;
          doc.moveTo(startX, currentY).lineTo(startX + fullWidth, currentY).strokeColor("#e2e8f0").stroke();
        }

        // --- 5. TOTALS SECTION ---
        const totalsHeight = 36;
        doc.rect(startX, currentY, fullWidth, totalsHeight).fillAndStroke(tableHeaderBg, borderColor);
        doc.moveTo(startX, currentY + 18).lineTo(startX + fullWidth, currentY + 18).strokeColor(borderColor).stroke();

        doc.fillColor(textColor).fontSize(8).font("Helvetica-Bold");

        if (isInterState) {
          doc.text("TOTAL TAXABLE VALUE:", startX + 10, currentY + 5);
          doc.font("Helvetica").text(`Rs. ${pdfPrice(totalTaxable)}`, startX + 130, currentY + 5);

          doc.font("Helvetica-Bold").text(`TOTAL IGST (${igstRateStr}):`, startX + 240, currentY + 5);
          doc.font("Helvetica").text(`Rs. ${pdfPrice(totalIgst)}`, startX + 335, currentY + 5);
        } else {
          doc.text("TOTAL TAXABLE VALUE:", startX + 10, currentY + 5);
          doc.font("Helvetica").text(`Rs. ${pdfPrice(totalTaxable)}`, startX + 130, currentY + 5);

          doc.font("Helvetica-Bold").text(`TOTAL CGST (${halfRateStr}):`, startX + 240, currentY + 5);
          doc.font("Helvetica").text(`Rs. ${pdfPrice(totalCgst)}`, startX + 330, currentY + 5);

          doc.font("Helvetica-Bold").text(`TOTAL SGST (${halfRateStr}):`, startX + 10, currentY + 22);
          doc.font("Helvetica").text(`Rs. ${pdfPrice(totalSgst)}`, startX + 130, currentY + 22);
        }

        const finalTotal = order.pricing?.total || (totalTaxable + (isInterState ? totalIgst : (totalCgst + totalSgst)) - (order.pricing?.discount || 0));
        doc.font("Helvetica-Bold").fontSize(9.5).text("GRAND TOTAL:", startX + 340, currentY + 22);
        doc.font("Helvetica-Bold").fontSize(10).fillColor(brandRed).text(`Rs. ${pdfPrice(finalTotal)}`, startX + 430, currentY + 22, { width: 75, align: "right" });

        currentY += totalsHeight;

        // --- 6. GRAND TOTAL IN WORDS ---
        const wordsHeight = 16;
        doc.rect(startX, currentY, fullWidth, wordsHeight).strokeColor(borderColor).stroke();
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(textColor);
        doc.text(`GRAND TOTAL IN WORDS: ${numberToWords(finalTotal)}`, startX + 8, currentY + 4);
        currentY += wordsHeight;

        // --- 7. PAYMENT DETAILS & CASH COLLECTION BREAKDOWN BOX ---
        const paymentBoxHeight = 44;
        const paymentBg = isDelivered ? "#f0fdf4" : (isCod ? "#fffbeb" : "#f8fafc");
        const paymentBorder = isDelivered ? "#86efac" : (isCod ? "#fde68a" : borderColor);

        doc.rect(startX, currentY, fullWidth, paymentBoxHeight).fillAndStroke(paymentBg, paymentBorder);
        doc.moveTo(startX, currentY + 22).lineTo(startX + fullWidth, currentY + 22).strokeColor(paymentBorder).stroke();

        // Row 1: Payment Method & Status
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(textColor).text("PAYMENT MODE: ", startX + 10, currentY + 5, { continued: true });
        
        if (isCod) {
          if (isDelivered) {
            doc.font("Helvetica-Bold").fillColor("#15803d").text("CASH ON DELIVERY (DELIVERED & SETTLED)", { continued: true });
            doc.font("Helvetica-Bold").fillColor(textColor).text("    |    PAYMENT STATUS: ", { continued: true });
            doc.font("Helvetica-Bold").fillColor("#15803d").text("100% PAID IN FULL (CASH COLLECTED AT DELIVERY)");
          } else {
            const codLabel = advancePaid > 0 ? "CASH ON DELIVERY (PARTIAL ONLINE ADVANCE)" : "CASH ON DELIVERY (100% COD)";
            doc.font("Helvetica-Bold").fillColor(brandRed).text(codLabel, { continued: true });
            doc.font("Helvetica-Bold").fillColor(textColor).text("    |    PAYMENT STATUS: ", { continued: true });
            doc.font("Helvetica-Bold").fillColor(advancePaid > 0 ? "#b45309" : codHighlightColor).text(
              advancePaid > 0 ? "ADVANCE PAID (BALANCE COD DUE AT DELIVERY)" : "PENDING CASH COLLECTION"
            );
          }
        } else {
          doc.font("Helvetica-Bold").fillColor("#15803d").text(`PREPAID ONLINE (${order.paymentMethod.toUpperCase()})`, { continued: true });
          doc.font("Helvetica-Bold").fillColor(textColor).text("    |    PAYMENT STATUS: ", { continued: true });
          doc.font("Helvetica-Bold").fillColor("#15803d").text(isDelivered ? "DELIVERED - PAID IN FULL" : "CONFIRMED - PAID IN FULL");
        }

        // Row 2: Advance Paid vs Balance To Collect
        if (isCod) {
          if (isDelivered) {
            doc.fontSize(7.5).font("Helvetica-Bold").fillColor(textColor).text("ONLINE ADVANCE: ", startX + 10, currentY + 26, { continued: true });
            doc.font("Helvetica").text(`Rs. ${pdfPrice(advancePaid)}`, { continued: true });
            doc.font("Helvetica-Bold").fillColor(textColor).text("    |    CASH COLLECTED AT DELIVERY: ", { continued: true });
            doc.font("Helvetica").text(`Rs. ${pdfPrice(balanceCodCollected)}`, { continued: true });
            doc.font("Helvetica-Bold").fillColor(textColor).text("    |    ", { continued: true });
            doc.font("Helvetica-Bold").fillColor("#15803d").text("BALANCE DUE: Rs. 0.00 (PAID IN FULL)");
          } else {
            doc.fontSize(7.5).font("Helvetica-Bold").fillColor(textColor).text("ONLINE ADVANCE PAID: ", startX + 10, currentY + 26, { continued: true });
            doc.font("Helvetica").text(`Rs. ${pdfPrice(advancePaid)} (Paid Online via UPI/Gateway)`, { continued: true });
            doc.font("Helvetica-Bold").fillColor(textColor).text("    |    ", { continued: true });
            doc.font("Helvetica-Bold").fillColor(codHighlightColor).text(`BALANCE CASH TO COLLECT ON DELIVERY: Rs. ${pdfPrice(balanceCodToCollect)}`);
          }
        } else {
          doc.fontSize(7.5).font("Helvetica-Bold").fillColor(textColor).text("AMOUNT PAID ONLINE: ", startX + 10, currentY + 26, { continued: true });
          doc.font("Helvetica").text(`Rs. ${pdfPrice(finalTotal)} (Paid via Online Payment Gateway)`, { continued: true });
          doc.font("Helvetica-Bold").fillColor(textColor).text("    |    ", { continued: true });
          doc.font("Helvetica-Bold").fillColor("#15803d").text("BALANCE TO COLLECT: Rs. 0.00 (DO NOT COLLECT CASH - 100% PREPAID)");
        }

        currentY += paymentBoxHeight;

        // --- 8. TERMS & CONDITIONS (DYNAMIC FLOW - NO OVERLAPPING) + SIGNATORY FOOTER ---
        const footerHeight = 84;
        doc.rect(startX, currentY, fullWidth, footerHeight).strokeColor(borderColor).stroke();

        // Vertical divider between Terms & Conditions (Left) and Signatory (Right)
        const termsWidth = 325;
        doc.moveTo(startX + termsWidth, currentY).lineTo(startX + termsWidth, currentY + footerHeight).strokeColor(borderColor).stroke();

        // Left Side: Terms & Conditions (DYNAMIC VERTICAL FLOW - NO OVERLAPPING)
        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(textColor).text("TERMS & CONDITIONS (STORE4RIDERS EXCHANGE POLICY):", startX + 8, currentY + 6);
        
        doc.fontSize(6.5).font("Helvetica").fillColor(mutedTextColor);
        const termsList = [
          "1. 7-Day Exchange Policy: Size and fit exchanges only within 7 days of delivery.",
          "2. Strict No-Refund Policy: No monetary refunds. Size replacements provided for unused items.",
          "3. Gear must be unworn with original manufacturer tags, labels, and box packaging intact.",
          "4. Warranty claims are governed strictly by the respective brand/manufacturer policy.",
          "5. Errors & Omissions Excepted (E.&O.E.). All disputes subject to Pune / Maharashtra jurisdiction."
        ];

        let termY = currentY + 18;
        for (const term of termsList) {
          doc.text(term, startX + 8, termY, { width: 308, lineGap: 1 });
          termY = doc.y + 2.5; // doc.y guarantees each line starts precisely below the previous one!
        }

        // Right Side: Digital / Computer-Generated Invoice Notice (NO PHYSICAL SIGNATURE NEEDED)
        const rightColX = startX + termsWidth + 8;
        doc.fontSize(8).font("Helvetica-Bold").fillColor(textColor).text(`For ${storeLegalName.toUpperCase()}:`, rightColX, currentY + 6);

        doc.fontSize(7.5).font("Helvetica-Bold").fillColor(brandRed).text("[ Digitally Authorized System Invoice ]", rightColX, currentY + 28);

        doc.fontSize(6.5).font("Helvetica-Oblique").fillColor(mutedTextColor).text(
          "This is a computer-generated tax invoice. In accordance with the Information Technology Act, 2000 and Indian GST invoice rules, no physical signature is required.",
          rightColX,
          currentY + 42,
          { width: 170, lineGap: 1.5 }
        );

        currentY += footerHeight;

        // Bottom bar
        doc.fontSize(7).font("Helvetica").fillColor(mutedTextColor).text(
          `${storeLegalName} | Dispatch: ${storeCity}, ${storeState} | GSTIN: ${storeGstin} | support@store4riders.com | www.store4riders.com`,
          startX,
          currentY + 6,
          { width: fullWidth, align: "center" }
        );

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

  static async generateAndSaveInvoice(order: IOrder): Promise<string> {
    const uploadUrl = await this.getOrGenerateInvoiceUrl(order);
    try {
      const { OrderModel } = await import("../../modules/order/order.model");
      await OrderModel.findByIdAndUpdate(order.id || (order as any)._id, { invoiceUrl: uploadUrl });
    } catch {}
    return uploadUrl;
  }
}
