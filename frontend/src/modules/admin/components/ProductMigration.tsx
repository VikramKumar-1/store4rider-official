"use client";

import React, { useState, useRef, useEffect } from "react";
import { apiClient } from "@/core/api/client";
import { useBrands } from "@/core/hooks/useBrands";
import { downloadBrandProductCsv } from "@/core/utils/exportCsv";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";

export function ProductMigration() {
  const { data: brands = [] } = useBrands();
  const [selectedExportBrand, setSelectedExportBrand] = useState("all");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({ type: "idle", message: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus({ type: "idle", message: "" });
    }
  };

  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (jobId) {
      interval = setInterval(async () => {
        try {
          const res = await apiClient.get(`/migration/status/${jobId}`);
          const data = res.data?.data;
          if (!data) return;
          
          setProgress(data.progress || 0);
          
          if (data.state === "completed") {
            clearInterval(interval);
            setJobId(null);
            setIsUploading(false);
            setStatus({ 
              type: "success", 
              message: `Upload Complete! Successfully processed ${data.result?.successCount || 0} products.` 
            });
          } else if (data.state === "failed") {
            clearInterval(interval);
            setJobId(null);
            setIsUploading(false);
            setStatus({ type: "error", message: `Upload failed: ${data.failedReason || "Unknown error"}` });
          }
        } catch (error) {
          console.error("Failed to fetch job status", error);
        }
      }, 1000); // Poll every 1 second
    }
    return () => clearInterval(interval);
  }, [jobId]);

  const handleUpload = async () => {
    if (!file) {
      setStatus({ type: "error", message: "Please select a file first." });
      return;
    }

    if (!file.name.endsWith(".csv")) {
      setStatus({ type: "error", message: "Only .csv files are allowed." });
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setStatus({ type: "idle", message: "" });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiClient.post("/migration/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newJobId = response.data?.data?.jobId;
      if (newJobId) {
        setJobId(newJobId);
        setStatus({ type: "idle", message: "File uploaded. Processing..." });
      } else {
        setIsUploading(false);
        setStatus({ type: "error", message: "Failed to get Job ID from server." });
      }
      
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (error: any) {
      setIsUploading(false);
      setStatus({ 
        type: "error", 
        message: error.response?.data?.error || error.message || "Failed to upload the file. Please try again." 
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bulk Product Upload & CSV Manager</h1>
        <p className="text-gray-600">
          Export products by brand to easily review and update prices, stocks, and variants in Excel / Google Sheets, or upload your completed CSV file below.
        </p>
      </div>

      {/* Brand CSV Download Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ArrowDownTrayIcon className="w-5 h-5 text-emerald-600" />
              Download Products CSV by Brand
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select a brand to download only its products in Magento-standard CSV format. Edit prices or stocks in your spreadsheet and upload it back below.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedExportBrand}
              onChange={(e) => setSelectedExportBrand(e.target.value)}
              className="text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 min-w-[200px]"
            >
              <option value="all">🌐 All Brands (Full Catalog)</option>
              {brands.map((b) => (
                <option key={b._id} value={b.name}>
                  🏷️ {b.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => downloadBrandProductCsv(selectedExportBrand)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        <h2 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
          <ArrowUpTrayIcon className="w-5 h-5 text-brand" />
          Upload Updated CSV
        </h2>

        {/* Informative CSV Column & Variant Guide */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">
              📘 CSV Column Reference & Formatting Guide (For Admin)
            </span>
            <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
              Standard 39 Columns
            </span>
          </div>

          <p className="text-slate-600 leading-relaxed text-[11.5px]">
            This bulk upload processes Magento & Store4Riders product spreadsheets. It automatically supports parent configurable products, individual child size/color variants, and color swatches.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-mono text-[11px]">
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 font-sans block text-xs border-b border-slate-100 pb-1">
                1. Product & Identification
              </span>
              <div><strong className="text-brand">sku</strong>: Master or Variant SKU</div>
              <div><strong className="text-brand">name</strong>: Full Title</div>
              <div><strong className="text-brand">product_type</strong>: simple / configurable</div>
              <div><strong className="text-brand">brand</strong>: Brand Name</div>
              <div><strong className="text-brand">categories</strong>: Category Path</div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 font-sans block text-xs border-b border-slate-100 pb-1">
                2. Price, Stock & Visibility
              </span>
              <div><strong className="text-brand">price</strong>: Base Selling Price (₹)</div>
              <div><strong className="text-brand">special_price</strong>: Offer Price (₹)</div>
              <div><strong className="text-brand">qty</strong>: Stock Quantity Count</div>
              <div><strong className="text-brand">is_in_stock</strong>: 1 (In) / 0 (Out)</div>
              <div><strong className="text-brand">status</strong>: 1 (Enabled) / 0 (Disabled)</div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 font-sans block text-xs border-b border-slate-100 pb-1">
                3. Swatches & Variations
              </span>
              <div><strong className="text-brand">color_swatches</strong>:</div>
              <div className="text-[10px] text-slate-600 font-sans leading-tight pl-2">
                <code>Matte Black=#1F1F1F|Red=#DC2626</code>
              </div>
              <div className="pt-1"><strong className="text-brand">configurable_variations</strong>:</div>
              <div className="text-[10px] text-slate-600 font-sans leading-tight pl-2 truncate">
                <code>sku=SKU-1,price=4500,qty=10,color=Black,size=M|...</code>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
            <span>
              💡 <strong>Bulk Stock Update:</strong> You can upload a simple CSV with only <code className="font-bold">sku</code> and <code className="font-bold">qty</code> (or <code className="font-bold">price</code>) to instantly update inventory across thousands of variants!
            </span>
          </div>
        </div>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mb-4" />
          
          <p className="text-lg font-medium text-gray-700 mb-1">
            {file ? file.name : "Click to select Magento CSV"}
          </p>
          <p className="text-sm text-gray-500">
            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Only .csv files are supported"}
          </p>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv"
            onChange={handleFileChange}
          />
        </div>

        {status.message && (
          <div className={`mt-6 p-4 rounded-md ${status.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : status.type === "error" ? "bg-red-50 text-red-800 border border-red-200" : "bg-blue-50 text-blue-800 border border-blue-200"}`}>
            <div className="flex items-center">
              {status.type === "success" ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 shrink-0" />
              ) : status.type === "error" ? (
                <XCircleIcon className="h-5 w-5 text-red-500 mr-2 shrink-0" />
              ) : (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2 shrink-0" />
              )}
              <span className="font-medium">{status.message}</span>
            </div>
            
            {jobId && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1 font-medium text-blue-800">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`px-6 py-2 rounded-md font-medium text-white transition-colors flex items-center ${
              !file || isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
            }`}
          >
            {isUploading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin -ml-1 mr-2" />
            )}
            {isUploading ? "Uploading & Processing..." : "Start Bulk Upload"}
          </button>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-blue-900 font-semibold flex items-center mb-2">
          <InformationCircleIcon className="w-5 h-5 mr-2 shrink-0 text-blue-600" />
          How it works
        </h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>This process happens entirely in the background. Your browser will not freeze.</li>
          <li>Products with the same SKU will automatically update (Upsert) instead of duplicating.</li>
          <li>Configurable variants are merged automatically using their child SKUs.</li>
          <li>All extra columns from Magento are automatically saved securely into the database attributes.</li>
        </ul>
      </div>
    </div>
  );
}
