"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { parseColorToBackground } from "@/modules/product-detail/components/ProductDetailPageModule";
import { Check, RotateCcw, ArrowLeftRight, RotateCw } from "lucide-react";

interface ColorSwatchModalProps {
  isOpen: boolean;
  colorName: string;
  currentSwatch?: string;
  targetVariantIndex?: number;
  sameColorCount?: number;
  zIndex?: string;
  onClose: () => void;
  onSave: (swatchValue: string, finalColorName: string, applyToAllMatching?: boolean) => void;
  onReset: () => void;
}

export const COLOR_NAMES: Array<{ name: string; hex: string; r: number; g: number; b: number }> = [
  { name: "Black", hex: "#111111", r: 17, g: 17, b: 17 },
  { name: "Pitch Black", hex: "#000000", r: 0, g: 0, b: 0 },
  { name: "Matte Black", hex: "#1F1F1F", r: 31, g: 31, b: 31 },
  { name: "White", hex: "#FFFFFF", r: 255, g: 255, b: 255 },
  { name: "Metallic Gold", hex: "#D4AF37", r: 212, g: 175, b: 55 },
  { name: "Amber Gold", hex: "#D97706", r: 217, g: 119, b: 6 },
  { name: "Gloss Red", hex: "#DC2626", r: 220, g: 38, b: 38 },
  { name: "Crimson Red", hex: "#991B1B", r: 153, g: 27, b: 27 },
  { name: "Fluo Green / Neon", hex: "#CCFF00", r: 204, g: 255, b: 0 },
  { name: "Hi-Vis Yellow", hex: "#EAB308", r: 234, g: 179, b: 8 },
  { name: "Fluo Yellow", hex: "#DFFF00", r: 223, g: 255, b: 0 },
  { name: "Lemon Yellow", hex: "#FACC15", r: 250, g: 204, b: 21 },
  { name: "Bright Yellow", hex: "#FFFF00", r: 255, g: 255, b: 0 },
  { name: "Royal Blue", hex: "#2563EB", r: 37, g: 99, b: 235 },
  { name: "Navy Blue", hex: "#1E3A8A", r: 30, g: 58, b: 138 },
  { name: "Sky Blue", hex: "#38BDF8", r: 56, g: 189, b: 248 },
  { name: "Vibrant Orange", hex: "#EA580C", r: 234, g: 88, b: 12 },
  { name: "KTM Orange", hex: "#FF6600", r: 255, g: 102, b: 0 },
  { name: "Fluo Orange", hex: "#FF5500", r: 255, g: 85, b: 0 },
  { name: "Anthracite", hex: "#2B2D2F", r: 43, g: 45, b: 47 },
  { name: "Dark Grey / Charcoal", hex: "#374151", r: 55, g: 65, b: 81 },
  { name: "Titanium / Gunmetal", hex: "#52525B", r: 82, g: 82, b: 91 },
  { name: "Slate Grey", hex: "#6B7280", r: 107, g: 114, b: 128 },
  { name: "Silver", hex: "#C0C0C0", r: 192, g: 192, b: 192 },
  { name: "Light Grey", hex: "#D1D5DB", r: 209, g: 213, b: 219 },
  { name: "Maroon / Burgundy", hex: "#800020", r: 128, g: 0, b: 32 },
  { name: "Olive Green", hex: "#556B2F", r: 85, g: 107, b: 47 },
  { name: "Camo Green", hex: "#4A5D4E", r: 74, g: 93, b: 78 },
  { name: "Forest Green", hex: "#16A34A", r: 22, g: 163, b: 74 },
  { name: "Dark Green", hex: "#1B4332", r: 27, g: 67, b: 50 },
  { name: "Pink", hex: "#EC4899", r: 236, g: 72, b: 153 },
  { name: "Purple", hex: "#7C3AED", r: 124, g: 58, b: 237 },
  { name: "Teal", hex: "#0D9488", r: 13, g: 148, b: 136 },
  { name: "Cyan", hex: "#06B6D4", r: 6, g: 182, b: 212 },
  { name: "Beige / Sand", hex: "#E5D3B3", r: 229, g: 211, b: 179 },
  { name: "Khaki", hex: "#C3B091", r: 195, g: 176, b: 145 },
  { name: "Bourbon Brown", hex: "#78350F", r: 120, g: 53, b: 15 },
];

export function getReadableColorName(hex: string): string {
  if (!hex) return "Unknown";
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 6 && clean.length !== 3) return "Custom";

  let r = 0, g = 0, b = 0;
  if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  } else if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  }
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "Custom";

  let bestMatch = COLOR_NAMES[0];
  let minDistance = Infinity;

  for (const c of COLOR_NAMES) {
    const d = 2 * Math.pow(r - c.r, 2) + 4 * Math.pow(g - c.g, 2) + 3 * Math.pow(b - c.b, 2);
    if (d < minDistance) {
      minDistance = d;
      bestMatch = c;
    }
  }

  return bestMatch.name;
}

export function extractColorsFromCss(css: string): string[] {
  if (!css) return [];
  const matches = css.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g);
  if (!matches || matches.length === 0) return [];

  // Deduplicate consecutive identical hex codes (e.g. from linear gradient color stops)
  const result: string[] = [];
  for (const m of matches) {
    const upper = m.toUpperCase();
    if (result.length === 0 || result[result.length - 1] !== upper) {
      result.push(upper);
    }
  }
  return result;
}

const POPULAR_SINGLE = [
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

const POPULAR_DUAL = [
  { name: "Flu. Yellow / Red", c: ["#EAB308", "#DC2626"] },
  { name: "Black / Red", c: ["#111111", "#DC2626"] },
  { name: "Black / Orange", c: ["#111111", "#EA580C"] },
  { name: "Black / Flu. Green", c: ["#111111", "#CCFF00"] },
  { name: "Black / Grey", c: ["#111111", "#6B7280"] },
  { name: "White / Red", c: ["#FFFFFF", "#DC2626"] },
  { name: "Blue / White", c: ["#2563EB", "#FFFFFF"] },
  { name: "Silver / Black", c: ["#C0C0C0", "#111111"] },
];

const POPULAR_TRI = [
  { name: "Italian Tricolore (Dainese/AGV)", c: ["#009246", "#FFFFFF", "#CE2B37"] },
  { name: "BMW M Motorsport", c: ["#0066B1", "#5B2B82", "#E21B23"] },
  { name: "Black / Flu. Yellow / Red", c: ["#111111", "#EAB308", "#DC2626"] },
  { name: "Black / Flu. Green / White (Kawasaki)", c: ["#111111", "#CCFF00", "#FFFFFF"] },
  { name: "Black / White / Red (Sport)", c: ["#111111", "#FFFFFF", "#DC2626"] },
  { name: "Blue / White / Red (Racing)", c: ["#2563EB", "#FFFFFF", "#DC2626"] },
];

const POPULAR_QUAD = [
  { name: "Black / White / Red / Grey", c: ["#111111", "#FFFFFF", "#DC2626", "#6B7280"] },
  { name: "Black / Flu. Green / Orange / White", c: ["#111111", "#CCFF00", "#EA580C", "#FFFFFF"] },
  { name: "Navy / Blue / White / Red", c: ["#1E3A8A", "#2563EB", "#FFFFFF", "#DC2626"] },
  { name: "Black / Camo / Olive / Grey (Adventure)", c: ["#111111", "#4A5D4E", "#556B2F", "#6B7280"] },
];

export function getGradientCss(count: number, colors: string[]): string {
  if (count <= 1) return colors[0] || "#111111";
  if (count === 2) {
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]} 49.5%, ${colors[1]} 50.5%, ${colors[1]} 100%)`;
  }
  if (count === 3) {
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]} 32.8%, ${colors[1]} 33.3%, ${colors[1]} 66.1%, ${colors[2]} 66.6%, ${colors[2]} 100%)`;
  }
  // 4 colors
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]} 24.5%, ${colors[1]} 25.5%, ${colors[1]} 49.5%, ${colors[2]} 50.5%, ${colors[2]} 74.5%, ${colors[3]} 75.5%, ${colors[3]} 100%)`;
}

export function ColorSwatchModal({
  isOpen,
  colorName,
  currentSwatch,
  targetVariantIndex,
  sameColorCount,
  zIndex,
  onClose,
  onSave,
  onReset,
}: ColorSwatchModalProps) {
  const [colorCount, setColorCount] = useState<1 | 2 | 3 | 4>(1);
  const [customColorName, setCustomColorName] = useState<string>("");
  const [applyToAllMatching, setApplyToAllMatching] = useState<boolean>(true);
  const [swatchColors, setSwatchColors] = useState<string[]>([
    "#111111",
    "#EAB308",
    "#DC2626",
    "#FFFFFF",
  ]);

  // Compute readable name from active swatch colors
  const activeColorNames = swatchColors
    .slice(0, colorCount)
    .map((c) => getReadableColorName(c));

  // Deduplicate consecutive identical names (e.g. [Hi-Vis Yellow, Hi-Vis Yellow] -> [Hi-Vis Yellow])
  const distinctNames = activeColorNames.filter(
    (name, idx) => idx === 0 || name !== activeColorNames[idx - 1]
  );

  const autoReadableName =
    colorCount === 1 ? activeColorNames[0] : distinctNames.join(" / ");

  useEffect(() => {
    if (!isOpen) return;

    const initialName = (colorName || "").trim();
    setCustomColorName(initialName === "Standard" ? "" : initialName);

    const effective = currentSwatch || (initialName ? parseColorToBackground(initialName) : "");
    const distinctColors = extractColorsFromCss(effective);

    if (distinctColors && distinctColors.length >= 2) {
      const count = Math.min(Math.max(distinctColors.length, 2), 4) as 2 | 3 | 4;
      setColorCount(count);
      setSwatchColors((prev) => {
        const next = [...prev];
        distinctColors.forEach((h, idx) => {
          if (idx < 4) next[idx] = h;
        });
        return next;
      });
    } else if (distinctColors && distinctColors.length === 1) {
      setColorCount(1);
      setSwatchColors((prev) => [distinctColors[0], prev[1], prev[2], prev[3]]);
    } else {
      setColorCount(1);
      setSwatchColors(["#111111", "#EAB308", "#DC2626", "#FFFFFF"]);
    }
  }, [isOpen, colorName, currentSwatch]);

  const livePreview = getGradientCss(colorCount, swatchColors);

  const handleColorChange = (index: number, value: string) => {
    setSwatchColors((prev) => {
      const next = [...prev];
      next[index] = value.toUpperCase();
      return next;
    });
  };

  const handleHexInputChange = (index: number, raw: string) => {
    const clean = raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    handleColorChange(index, `#${clean}`);
  };

  const handleSwap = () => {
    if (colorCount === 2) {
      setSwatchColors(([c1, c2, c3, c4]) => [c2, c1, c3, c4]);
    } else {
      setSwatchColors((prev) => {
        const active = prev.slice(0, colorCount);
        const rest = prev.slice(colorCount);
        const rotated = [...active.slice(1), active[0]];
        return [...rotated, ...rest];
      });
    }
  };

  const handleSave = () => {
    const finalName = customColorName.trim() || autoReadableName || "Standard";
    if (colorCount === 1) {
      onSave(swatchColors[0].toUpperCase(), finalName, applyToAllMatching);
    } else {
      const gradient = getGradientCss(
        colorCount,
        swatchColors.slice(0, colorCount).map((c) => c.toUpperCase())
      );
      onSave(gradient, finalName, applyToAllMatching);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customize Color Swatch" maxWidth="max-w-lg" zIndex={zIndex || "z-[60]"}>
      <div className="space-y-4 pt-1">
        {/* Swatch Preview & Color Name Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
          <div className="flex items-center gap-3.5">
            {/* Live Circular Swatch */}
            <div
              className="w-13 h-13 rounded-full border-2 border-white shadow-md ring-2 ring-black/10 shrink-0 transition-all"
              style={{ background: livePreview }}
            />

            {/* Direct Color Name Input */}
            <div className="min-w-0 flex-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Color Name (For Variant Table)
              </label>
              <input
                type="text"
                value={customColorName}
                onChange={(e) => setCustomColorName(e.target.value)}
                placeholder={autoReadableName || colorName || "e.g. Gloss Red"}
                className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Status info bar */}
          <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200/80 text-slate-500">
            <span className="truncate">
              Detected Shade: <strong className="text-slate-800">{autoReadableName}</strong>
            </span>
            <span className="font-mono text-slate-400 font-semibold shrink-0">
              {colorCount === 1
                ? swatchColors[0]
                : swatchColors.slice(0, colorCount).join(" / ")}
            </span>
          </div>

          {/* Quick Bulk-Apply Checkbox */}
          {sameColorCount && sameColorCount > 1 && (
            <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs">
              <input
                type="checkbox"
                checked={applyToAllMatching}
                onChange={(e) => setApplyToAllMatching(e.target.checked)}
                className="rounded border-slate-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
              />
              <span>
                Apply this color to all <strong>{sameColorCount} sizes</strong> with &quot;{colorName || "Standard"}&quot;
              </span>
            </label>
          )}

          <span className="text-[9.5px] text-slate-400 block">
            {targetVariantIndex !== undefined
              ? (applyToAllMatching && sameColorCount && sameColorCount > 1
                  ? `Will update all ${sameColorCount} matching sizes at once.`
                  : `Only variant #${targetVariantIndex + 1} will be updated.`)
              : `Applies to all variants sharing color "${colorName || "Standard"}".`}
          </span>
        </div>

        {/* Number of Colors Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Color Pattern Type
          </label>
          <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setColorCount(1)}
              className={`py-1.5 px-1 rounded-md transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                colorCount === 1 ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-brand shrink-0" />
              <span className="text-[11px]">1 (Single)</span>
            </button>

            <button
              type="button"
              onClick={() => setColorCount(2)}
              className={`py-1.5 px-1 rounded-md transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                colorCount === 2 ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/20"
                style={{ background: "linear-gradient(135deg, #EAB308 50%, #DC2626 50%)" }}
              />
              <span className="text-[11px]">2 (Dual)</span>
            </button>

            <button
              type="button"
              onClick={() => setColorCount(3)}
              className={`py-1.5 px-1 rounded-md transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                colorCount === 3 ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/20"
                style={{ background: "linear-gradient(135deg, #009246 33%, #FFFFFF 33%, #FFFFFF 66%, #CE2B37 66%)" }}
              />
              <span className="text-[11px]">3 (Tri-Color)</span>
            </button>

            <button
              type="button"
              onClick={() => setColorCount(4)}
              className={`py-1.5 px-1 rounded-md transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                colorCount === 4 ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/20"
                style={{ background: "linear-gradient(135deg, #111 25%, #FFF 25%, #FFF 50%, #DC2626 50%, #DC2626 75%, #6B7280 75%)" }}
              />
              <span className="text-[11px]">4 (Quad)</span>
            </button>
          </div>
        </div>

        {/* Color Inputs Grid: Spacious 2-Column Responsive Layout */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-0.5">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              {colorCount === 1 ? "Color Shade & HEX" : `Selected Colors (${colorCount})`}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Click square for <strong className="text-slate-800">Color Wheel</strong> or type <strong className="text-slate-800">HEX Code</strong>
            </span>
          </div>

          <div
            className={`grid gap-2.5 ${
              colorCount === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
            }`}
          >
            {Array.from({ length: colorCount }).map((_, idx) => {
              const hex = swatchColors[idx] || "#111111";
              const inputId = `color-wheel-picker-input-${idx}`;
              const labelDesc =
                colorCount === 2
                  ? idx === 0 ? "Left Half" : "Right Half"
                  : `Stripe ${idx + 1}`;
              const readableName = getReadableColorName(hex);

              return (
                <div key={idx} className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      Color {idx + 1} ({labelDesc})
                    </span>
                    <span
                      className="text-[9.5px] font-bold text-brand bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs truncate max-w-[140px]"
                      title={readableName}
                    >
                      {readableName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Wheel Picker Square */}
                    <div className="flex flex-col items-center">
                      <label
                        htmlFor={inputId}
                        className="relative w-10 h-10 rounded-lg border-2 border-slate-300 shadow-xs cursor-pointer overflow-hidden flex items-center justify-center hover:scale-105 transition-transform shrink-0 ring-1 ring-black/5"
                        style={{ background: hex }}
                        title={`Click to choose Color ${idx + 1} from Color Wheel / Picker`}
                      >
                        <input
                          id={inputId}
                          type="color"
                          value={hex.startsWith("#") ? hex : "#111111"}
                          onChange={(e) => handleColorChange(idx, e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                      </label>
                      <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase">
                        Wheel
                      </span>
                    </div>

                    {/* Direct HEX Input */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-semibold text-slate-400 block mb-1">
                        Type or Paste HEX
                      </span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-xs">
                          #
                        </span>
                        <input
                          type="text"
                          value={hex.replace(/^#/, "")}
                          onChange={(e) => handleHexInputChange(idx, e.target.value)}
                          placeholder="HEX"
                          className="w-full pl-6 pr-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand focus:outline-none uppercase"
                          title={`Type 6-character hex code for Color ${idx + 1}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Bar for multi-color (Swap / Rotate) */}
          {colorCount > 1 && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={handleSwap}
                className="text-xs font-bold text-slate-600 hover:text-brand bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              >
                {colorCount === 2 ? (
                  <>
                    <ArrowLeftRight size={12} />
                    <span>Swap Colors</span>
                  </>
                ) : (
                  <>
                    <RotateCw size={12} />
                    <span>Rotate / Shift Order</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Popular Presets Section */}
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            {colorCount === 1
              ? "Popular Gear Colors (1-Click)"
              : colorCount === 2
              ? "Popular 2-Tone Combinations"
              : colorCount === 3
              ? "Popular Tri-Color / Racing Presets"
              : "Popular 4-Color Graphic Combos"}
          </span>

          {colorCount === 1 && (
            <div className="grid grid-cols-4 gap-1.5">
              {POPULAR_SINGLE.map((pc) => (
                <button
                  key={pc.name}
                  type="button"
                  onClick={() => {
                    handleColorChange(0, pc.hex);
                    setCustomColorName(pc.name);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left text-[11px] font-semibold transition-all cursor-pointer ${
                    swatchColors[0].toUpperCase() === pc.hex.toUpperCase()
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
          )}

          {colorCount === 2 && (
            <div className="grid grid-cols-2 gap-1.5">
              {POPULAR_DUAL.map((pd) => (
                <button
                  key={pd.name}
                  type="button"
                  onClick={() => {
                    handleColorChange(0, pd.c[0]);
                    handleColorChange(1, pd.c[1]);
                    setCustomColorName(pd.name);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-left text-xs font-medium transition-all cursor-pointer hover:bg-slate-50"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                    style={{ background: getGradientCss(2, pd.c) }}
                  />
                  <span className="truncate">{pd.name}</span>
                </button>
              ))}
            </div>
          )}

          {colorCount === 3 && (
            <div className="grid grid-cols-2 gap-1.5">
              {POPULAR_TRI.map((pt) => (
                <button
                  key={pt.name}
                  type="button"
                  onClick={() => {
                    handleColorChange(0, pt.c[0]);
                    handleColorChange(1, pt.c[1]);
                    handleColorChange(2, pt.c[2]);
                    setCustomColorName(pt.name);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-left text-xs font-medium transition-all cursor-pointer hover:bg-slate-50"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                    style={{ background: getGradientCss(3, pt.c) }}
                  />
                  <span className="truncate">{pt.name}</span>
                </button>
              ))}
            </div>
          )}

          {colorCount === 4 && (
            <div className="grid grid-cols-2 gap-1.5">
              {POPULAR_QUAD.map((pq) => (
                <button
                  key={pq.name}
                  type="button"
                  onClick={() => {
                    handleColorChange(0, pq.c[0]);
                    handleColorChange(1, pq.c[1]);
                    handleColorChange(2, pq.c[2]);
                    handleColorChange(3, pq.c[3]);
                    setCustomColorName(pq.name);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-left text-xs font-medium transition-all cursor-pointer hover:bg-slate-50"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                    style={{ background: getGradientCss(4, pq.c) }}
                  />
                  <span className="truncate">{pq.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

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
