"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Check, Plus, Layers, AlertCircle } from "lucide-react";
import { parseColorToBackground } from "@/modules/product-detail/components/ProductDetailPageModule";

interface AddSizeRunModalProps {
  isOpen: boolean;
  attributeSetName?: string;
  suggestedSizes: string[];
  existingColors: string[];
  onClose: () => void;
  onAdd: (colorName: string, selectedSizes: string[], swatchCss?: string) => void;
}

const QUICK_COLORS = [
  { name: "Matte Black", hex: "#1F1F1F" },
  { name: "Gloss Red", hex: "#DC2626" },
  { name: "Gloss White", hex: "#FFFFFF" },
  { name: "Hi-Vis Yellow", hex: "#EAB308" },
  { name: "KTM Orange", hex: "#FF6600" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Dark Grey", hex: "#374151" },
  { name: "Camo Green", hex: "#4A5D4E" },
  { name: "Fluo Green", hex: "#CCFF00" },
  { name: "Standard", hex: "#6B7280" },
];

export function AddSizeRunModal({
  isOpen,
  attributeSetName = "Sizes",
  suggestedSizes,
  existingColors,
  onClose,
  onAdd,
}: AddSizeRunModalProps) {
  const [colorName, setColorName] = useState<string>("");
  const [swatchCss, setSwatchCss] = useState<string>("#111111");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // If there are existing colors, default to empty so admin picks a NEW color
      // If no existing colors, default to "Standard"
      if (existingColors.length === 0) {
        setColorName("Standard");
        setSwatchCss("#6B7280");
      } else {
        setColorName("");
        setSwatchCss("#111111");
      }
      setSelectedSizes(suggestedSizes || []);
    }
  }, [isOpen, suggestedSizes, existingColors]);

  const handleSelectQuickColor = (name: string, hex: string) => {
    setColorName(name);
    setSwatchCss(hex);
  };

  const handleToggleSize = (s: string) => {
    setSelectedSizes((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  const handleSelectAllSizes = () => {
    setSelectedSizes(suggestedSizes || []);
  };

  const handleDeselectAllSizes = () => {
    setSelectedSizes([]);
  };

  const handleConfirm = () => {
    const finalColor = colorName.trim() || (existingColors.length === 0 ? "Standard" : "New Color");
    if (selectedSizes.length === 0) return;

    const finalSwatch = swatchCss || parseColorToBackground(finalColor) || "#111111";
    onAdd(finalColor, selectedSizes, finalSwatch);
    onClose();
  };

  const isExistingColor =
    Boolean(colorName.trim()) &&
    existingColors.some((c) => c.toLowerCase() === colorName.trim().toLowerCase());

  const previewBackground =
    swatchCss || (colorName.trim() ? parseColorToBackground(colorName.trim()) : "#111111");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add ${attributeSetName} Sizes`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 pt-1">
        {/* Existing Colors Banner */}
        {existingColors.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Existing Colors in Product:</span>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {existingColors.map((c) => (
                <span
                  key={c}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-bold text-slate-800 text-[11px] shadow-2xs"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Color Selection Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            1. Choose Color Name for this Size Run
          </label>

          <div className="flex items-center gap-3">
            {/* Swatch circle preview + wheel picker */}
            <label
              htmlFor="add-size-color-picker"
              className="relative w-11 h-11 rounded-full border-2 border-white shadow-md ring-2 ring-black/10 shrink-0 cursor-pointer overflow-hidden flex items-center justify-center hover:scale-105 transition-transform"
              style={{ background: previewBackground }}
              title="Click to pick custom color on wheel"
            >
              <input
                id="add-size-color-picker"
                type="color"
                value={swatchCss.startsWith("#") && swatchCss.length === 7 ? swatchCss : "#111111"}
                onChange={(e) => setSwatchCss(e.target.value.toUpperCase())}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </label>

            {/* Color name text input */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={colorName}
                onChange={(e) => {
                  const val = e.target.value;
                  setColorName(val);
                  const autoBg = parseColorToBackground(val);
                  if (autoBg && autoBg.startsWith("#")) {
                    setSwatchCss(autoBg);
                  }
                }}
                placeholder={existingColors.length > 0 ? "e.g. Matte Black, Gloss White" : "Standard or Color Name"}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Warning if color already exists */}
          {isExistingColor && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg font-medium">
              <AlertCircle size={13} className="shrink-0" />
              <span>
                Color &quot;{colorName}&quot; already exists! Adding will add more sizes to that existing group.
              </span>
            </div>
          )}

          {/* Quick 1-Click Color Badges */}
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-1.5 uppercase">
              Quick 1-Click Gear Colors:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_COLORS.map((qc) => {
                const isSelected = colorName.toLowerCase() === qc.name.toLowerCase();
                return (
                  <button
                    key={qc.name}
                    type="button"
                    onClick={() => handleSelectQuickColor(qc.name, qc.hex)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-brand text-white border-brand shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                      style={{ background: qc.hex }}
                    />
                    <span>{qc.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sizes Selection Checklist */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-0.5">
            <span className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">
              2. Select Sizes to Include ({selectedSizes.length} of {suggestedSizes.length})
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={handleSelectAllSizes}
                className="text-brand hover:underline font-bold cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleDeselectAllSizes}
                className="text-slate-500 hover:underline font-medium cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            {suggestedSizes.map((s) => {
              const isChecked = selectedSizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleToggleSize(s)}
                  className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    isChecked
                      ? "bg-white border-brand text-slate-900 shadow-2xs ring-1 ring-brand"
                      : "bg-white/50 border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  <span className="text-sm">{s}</span>
                  <span className={`text-[9px] ${isChecked ? "text-brand" : "text-slate-400"}`}>
                    {isChecked ? "Included" : "Skip"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={selectedSizes.length === 0}
            className="flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus size={14} />
            <span>
              Add {selectedSizes.length} Sizes for &quot;{colorName.trim() || "New Color"}&quot;
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
