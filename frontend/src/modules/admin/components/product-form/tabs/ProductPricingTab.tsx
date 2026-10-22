"use client";

import React from "react";
import { DollarSign } from "lucide-react";
import { useProductFormContext } from "../ProductFormContext";

export function ProductPricingTab() {
  const {
    basePrice,
    setBasePrice,
    specialPrice,
    setSpecialPrice,
    specialPriceFromDate,
    setSpecialPriceFromDate,
    specialPriceToDate,
    setSpecialPriceToDate,
    mapPrice,
    setMapPrice,
    msrpPrice,
    setMsrpPrice,
    stockStatus,
    setStockStatus,
    qty,
    setQty,
    notifyOnStockBelow,
    setNotifyOnStockBelow,
    allowBackorders,
    setAllowBackorders,
    taxClassName,
    setTaxClassName,
    isCustomTaxRate,
    setIsCustomTaxRate,
    customTaxRateInput,
    setCustomTaxRateInput,
    hsnCode,
    setHsnCode,
    shippingFee,
    setShippingFee,
  } = useProductFormContext();

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
      <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
        <DollarSign className="text-brand" size={18} />
        Pricing Rules & Warehouse Inventory
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Base Price / MRP (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            value={basePrice}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
            }}
            onChange={(e) => setBasePrice(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
            placeholder="e.g. 5499"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Special / Sale Price (₹)</label>
          <input
            type="number"
            min="0"
            value={specialPrice}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
            }}
            onChange={(e) => setSpecialPrice(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
            placeholder="e.g. 4899 (Optional promotional price)"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Special Price From Date</label>
          <input
            type="date"
            value={specialPriceFromDate}
            onChange={(e) => setSpecialPriceFromDate(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Special Price To Date</label>
          <input
            type="date"
            value={specialPriceToDate}
            onChange={(e) => setSpecialPriceToDate(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">MAP Price (Minimum Advertised Price)</label>
          <input
            type="number"
            min="0"
            value={mapPrice}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
            }}
            onChange={(e) => setMapPrice(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
            placeholder="Optional"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            MSRP Price (Manufacturer Suggested Retail Price)
          </label>
          <input
            type="number"
            min="0"
            value={msrpPrice}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
            }}
            onChange={(e) => setMsrpPrice(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
            placeholder="Optional"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="md:col-span-2 border-t border-slate-100 pt-4">
          <h4 className="text-sm font-semibold text-slate-800 mb-4">Stock & Warehouse Rules</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Stock Status</label>
          <select
            value={stockStatus}
            onChange={(e) => setStockStatus(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value={1}>In Stock (1)</option>
            <option value={0}>Out of Stock (0)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quantity Available (Qty)</label>
          <input
            type="number"
            min="0"
            value={qty}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
            }}
            onChange={(e) => setQty(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
            placeholder="e.g. 10"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock Alert Threshold</label>
          <input
            type="number"
            min="0"
            value={notifyOnStockBelow}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
            }}
            onChange={(e) => setNotifyOnStockBelow(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
            placeholder="e.g. 2"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex items-center pt-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allowBackorders}
              onChange={(e) => setAllowBackorders(e.target.checked)}
              className="rounded text-brand focus:ring-brand h-4 w-4"
            />
            <span className="text-sm font-medium text-slate-700">Allow Backorders when Out of Stock</span>
          </label>
        </div>

        {/* GST Tax Classification & Flexible Future Rate Slabs */}
        <div className="md:col-span-2 border-t border-slate-100 pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                GST Tax Classification & Rate
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Defines the GST rate applied to this product for customer invoices, cart calculation, and HSN filing.
              </p>
            </div>
            {/* Active Rate Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 self-start sm:self-auto">
              <span className="text-slate-500 font-medium">Applied Rate:</span>
              <span className="text-brand font-black">
                {taxClassName.match(/(\d+(?:\.\d+)?)/)?.[1] || "18"}% GST
              </span>
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "18% Standard", desc: "Helmets, Jackets, Gloves, Boots, Luggage", value: "Taxable Goods (GST 18%)", rate: 18 },
              { label: "12% Apparel", desc: "Textiles, Innerwear, Thermals", value: "Apparel & Textiles (GST 12%)", rate: 12 },
              { label: "28% High-Rate", desc: "Performance Spares, Exhausts, Electronics", value: "Auto Spares & Parts (GST 28%)", rate: 28 },
              { label: "5% Consumables", desc: "Oils, Lubricants, Cleaners", value: "Consumables & Lubricants (GST 5%)", rate: 5 },
              { label: "0% Exempt", desc: "Manuals, Literature, Catalogs", value: "Exempt Goods (GST 0%)", rate: 0 },
            ].map((preset) => {
              const isCurrent = !isCustomTaxRate && taxClassName === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setIsCustomTaxRate(false);
                    setTaxClassName(preset.value);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isCurrent
                      ? "bg-brand text-white border-brand shadow-xs"
                      : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                  title={preset.desc}
                >
                  <span>{preset.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setIsCustomTaxRate(true);
                if (customTaxRateInput === "") {
                  setCustomTaxRateInput(20);
                  setTaxClassName("GST 20% (Custom Slab)");
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isCustomTaxRate
                  ? "bg-brand text-white border-brand shadow-xs"
                  : "bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              <span>+ Custom / Future Tax Slab</span>
            </button>
          </div>

          {/* Custom Tax Rate Configuration (For future tax revisions or special slabs) */}
          {isCustomTaxRate ? (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span>⚡</span> Custom / Future GST Rate Configuration
                </span>
                <span className="text-[11px] text-amber-700">Supports any future tax rate changes or cess</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tax Rate Percentage (%) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={customTaxRateInput}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
                      }}
                      onChange={(e) => {
                        const val = e.target.value === "" ? "" : Math.min(100, Math.max(0, Number(e.target.value)));
                        setCustomTaxRateInput(val);
                        setTaxClassName(`GST ${val}% (Custom Slab)`);
                      }}
                      placeholder="e.g. 20 (if increased) or 15"
                      className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Custom Tax Class Label / Description
                  </label>
                  <input
                    type="text"
                    value={taxClassName}
                    onChange={(e) => setTaxClassName(e.target.value)}
                    placeholder="e.g. GST 20% (Revised 2027 Slab)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              Select a standard GST tier above, or click <strong>+ Custom / Future Tax Slab</strong> to enter any
              updated government tax rate.
            </p>
          )}

          {/* HSN Code Configuration */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="block text-xs font-bold text-slate-800">
                Harmonized System Nomenclature (HSN Code) *
              </label>
              <span className="text-[11px] text-slate-500">Required for official Tax Invoices & GST Returns</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Riding Presets:</span>
              {[
                { label: "6506 (Helmets)", code: "6506" },
                { label: "6203 (Jackets & Suits)", code: "6203" },
                { label: "6116 (Gloves)", code: "6116" },
                { label: "6403 (Boots)", code: "6403" },
                { label: "8708 (Spares & Parts)", code: "8708" },
                { label: "4202 (Bags & Luggage)", code: "4202" },
                { label: "2710 (Oils & Lubes)", code: "2710" },
              ].map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => setHsnCode(preset.code)}
                  className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                    hsnCode === preset.code
                      ? "bg-brand text-white border-brand shadow-xs"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="pt-1">
              <input
                type="text"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                placeholder="e.g. 6506 or 8708"
                className="w-full sm:w-64 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand font-mono font-bold"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Additional Heavy Item Shipping Surcharge (₹)
          </label>
          <input
            type="number"
            min="0"
            value={shippingFee}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
            }}
            onChange={(e) => setShippingFee(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
            placeholder="Leave blank or 0 for regular store shipping rules"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Optional surcharge applied for heavy or oversized freight (e.g. hard panniers, exhaust systems, paddock
            stands). Overrides free shipping.
          </p>
        </div>
      </div>
    </div>
  );
}
