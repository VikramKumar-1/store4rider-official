"use client";

import React, { useState, useRef, useEffect } from "react";
import { apiClient } from "@/core/api/client";

export function ProductMigration() {
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bulk Product Upload</h1>
        <p className="text-gray-600">
          Upload your product CSV file here. The system will automatically map the columns, merge parent/child variants, and securely store the extra columns into product attributes.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
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
            <div className="flex">
              {status.type === "success" ? (
                <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              ) : status.type === "error" ? (
                <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg className="animate-spin h-5 w-5 text-blue-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
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
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isUploading ? "Uploading & Processing..." : "Start Bulk Upload"}
          </button>
        </div>
      </div>
      
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-blue-900 font-semibold flex items-center mb-2">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
