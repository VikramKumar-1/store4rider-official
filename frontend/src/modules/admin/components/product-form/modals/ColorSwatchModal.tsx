"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { parseColorToBackground } from "@/modules/product-detail/components/ProductDetailPageModule";
import { Check, RotateCcw, ArrowLeftRight, Palette } from "lucide-react";

interface ColorSwatchModalProps {
  isOpen: boolean;
  colorName: string;
  currentSwatch?: string;
  onClose: () => void;
  onSave: (swatchValue: string) => void;
  onReset: () => void;
}

const POPULAR_COLORS = [
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Golden", hex: "#D4AF37" },
  { name: "Gloss Red", hex: "#DC2626" },
  { name: "Flu. Green", hex: "#CCFF00" },
  { name: "Hi-Vis Yellow", hex: "#EAB308" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Dark Grey", hex: "#374151" },
  { name: "Light Grey", hex: "#D1D5DB" },
  { name: "Maroon", hex: "#800020" },
  { name: "Olive", hex: "#556B2F" },
  { name: "Camo", hex: "#4A5D4E" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Silver", hex: "#C0C0C0" },
];

const POPULAR_SPLITS = [
  { name: "Flu. Yellow / Red", c1: "#EAB308", c2: "#DC2626" },
  { name: "Black / Red", c1: "#111111", c2: "#DC2626" },
  { name: "Black / Orange", c1: "#111111", c2: "#EA580C" },
  { name: "Black / Flu. Green", c1: "#111111", c2: "#CCFF00" },
  { name: "Black / Grey", c1: "#111111", c2: "#6B7280" },
  { name: "White / Red", c1: "#FFFFFF", c2: "#DC2626" },
  { name: "Blue / White", c1: "#2563EB", c2: "#FFFFFF" },
];

export function ColorSwatchModal({
  isOpen,
  colorName,
  currentSwatch,
  onClose,
  onSave,
  onReset,
}: ColorSwatchModalProps) {
  const [mode, setMode] = useState<"single" | "split">("single");
  const [singleHex, setSingleHex] = useState<string>("#111111");
  const [splitC1, setSplitC1] = useState<string>("#EAB308");
  const [splitC2, setSplitC2] = useState<string>("#DC2626");

  useEffect(() => {
    if (!isOpen) return;

    // Determine initial values
    const effective = currentSwatch || parseColorToBackground(colorName);

    if (effective.includes("gradient") || effective.includes(",") || colorName.includes("/") || colorName.toLowerCase().includes("split")) {
      setMode("split");
      // Try extracting colors from linear-gradient or comma
      const hexMatches = effective.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g);
      if (hexMatches && hexMatches.length >= 2) {
        setSplitC1(hexMatches[0].toUpperCase());
        setSplitC2(hexMatches[1].toUpperCase());
      } else {
        setSplitC1("#EAB308");
        setSplitC2("#DC2626");
      }
    } else {
      setMode("single");
      const hexMatch = effective.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/);
      if (hexMatch) {
        setSingleHex(hexMatch[0].toUpperCase());
      } else {
        setSingleHex("#111111");
      }
    }
  }, [isOpen, colorName, currentSwatch]);

  // Live preview calculation
  const livePreview = mode === "single"
    ? singleHex
    : `linear-gradient(135deg, ${splitC1} 0%, ${splitC1} 49.5%, ${splitC2} 50.5%, ${splitC2} 100%)`;

  const handleSave = () => {
    if (mode === "single") {
      onSave(singleHex.toUpperCase());
    } else {
      const gradient = `linear-gradient(135deg, ${splitC1.toUpperCase()} 0%, ${splitC1.toUpperCase()} 49.5%, ${splitC2.toUpperCase()} 50.5%, ${splitC2.toUpperCase()} 100%)`;
      onSave(gradient);
    }
    onClose();
  };

  const handleSwap = () => {
    const temp = splitC1;
    setSplitC1(splitC2);
    setSplitC2(temp);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customize Color Swatch" maxWidth="max-w-md">
      <div className="space-y-4 pt-1">
        {/* Header Preview Banner */}
        <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div
            className="w-12 h-12 rounded-full border-2 border-white shadow-md ring-2 ring-black/10 shrink-0"
            style={{ background: livePreview }}
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Color Name
            </span>
            <p className="font-bold text-slate-900 text-sm truncate">{colorName || "Standard"}</p>
            <span className="text-[10px] font-mono text-slate-500 font-semibold block truncate">
              {mode === "single" ? singleHex : `${splitC1} / ${splitC2}`}
            </span>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === "single" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-brand shrink-0" />
            <span>Single Color</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("split")}
            className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === "split" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/20"
              style={{ background: "linear-gradient(135deg, #EAB308 50%, #DC2626 50%)" }}
            />
            <span>Split / 2-Tone (Diagonal)</span>
          </button>
        </div>

        {/* Content based on Mode */}
        {mode === "single" ? (
          <div className="space-y-3">
            {/* Direct Hex Code Input & Native Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hex Code or Pick Shade
              </label>
              <div className="flex items-center gap-2">
                <label
                  className="relative w-10 h-10 rounded-lg border-2 border-slate-300 shadow-xs cursor-pointer overflow-hidden flex items-center justify-center hover:scale-105 transition-transform shrink-0"
                  style={{ background: singleHex }}
                  title="Click to open color picker / eyedropper"
                >
                  <input
                    type="color"
                    value={singleHex.startsWith("#") ? singleHex : "#111111"}
                    onChange={(e) => setSingleHex(e.target.value.toUpperCase())}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                </label>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                    #
                  </span>
                  <input
                    type="text"
                    value={singleHex.replace(/^#/, "")}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
                      setSingleHex(`#${val.toUpperCase()}`);
                    }}
                    placeholder="D4AF37"
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-brand focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Quick Popular Single Colors */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Popular Gear Colors (1-Click)
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {POPULAR_COLORS.map((pc) => (
                  <button
                    key={pc.name}
                    type="button"
                    onClick={() => setSingleHex(pc.hex)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left text-[11px] font-semibold transition-all cursor-pointer ${
                      singleHex.toUpperCase() === pc.hex.toUpperCase()
                        ? "border-brand bg-brand/5 text-brand ring-1 ring-brand font-bold"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20 shrink-0 shadow-2xs"
                      style={{ background: pc.hex }}
                    />
                    <span className="truncate">{pc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Two Color Pickers & Hex Inputs */}
            <div className="grid grid-cols-2 gap-3">
              {/* Color 1 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Color 1 (Left Half)
                </label>
                <div className="flex items-center gap-2">
                  <label
                    className="relative w-9 h-9 rounded-lg border-2 border-slate-300 shadow-xs cursor-pointer overflow-hidden flex items-center justify-center hover:scale-105 transition-transform shrink-0"
                    style={{ background: splitC1 }}
                    title="Click to pick Color 1"
                  >
                    <input
                      type="color"
                      value={splitC1.startsWith("#") ? splitC1 : "#CCFF00"}
                      onChange={(e) => setSplitC1(e.target.value.toUpperCase())}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </label>
                  <input
                    type="text"
                    value={splitC1}
                    onChange={(e) => setSplitC1(e.target.value.toUpperCase())}
                    placeholder="#CCFF00"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-brand uppercase"
                  />
                </div>
              </div>

              {/* Color 2 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Color 2 (Right Half)
                </label>
                <div className="flex items-center gap-2">
                  <label
                    className="relative w-9 h-9 rounded-lg border-2 border-slate-300 shadow-xs cursor-pointer overflow-hidden flex items-center justify-center hover:scale-105 transition-transform shrink-0"
                    style={{ background: splitC2 }}
                    title="Click to pick Color 2"
                  >
                    <input
                      type="color"
                      value={splitC2.startsWith("#") ? splitC2 : "#DC2626"}
                      onChange={(e) => setSplitC2(e.target.value.toUpperCase())}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </label>
                  <input
                    type="text"
                    value={splitC2}
                    onChange={(e) => setSplitC2(e.target.value.toUpperCase())}
                    placeholder="#DC2626"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-brand uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSwap}
                className="text-xs font-bold text-slate-600 hover:text-brand bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeftRight size={12} />
                <span>Swap Colors</span>
              </button>
            </div>

            {/* Quick 2-Tone Presets */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Popular 2-Tone Combinations
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {POPULAR_SPLITS.map((ps) => (
                  <button
                    key={ps.name}
                    type="button"
                    onClick={() => {
                      setSplitC1(ps.c1);
                      setSplitC2(ps.c2);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-left text-xs font-medium transition-all cursor-pointer hover:bg-slate-50"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                      style={{ background: `linear-gradient(135deg, ${ps.c1} 50%, ${ps.c2} 50%)` }}
                    />
                    <span className="truncate">{ps.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 gap-2">
          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="text-xs font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer transition-colors px-2 py-1"
            title="Remove custom hex and let smart engine auto-draw"
          >
            <RotateCcw size={12} />
            <span>Reset to Auto</span>
          </button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>Apply Swatch</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
