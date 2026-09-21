"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Upload, Download, Search, Edit2, Trash2, Box } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useProducts, useBulkUpdateProducts } from "@/core/hooks/useProducts";
import { toast } from "sonner";
import Link from "next/link";

export function AdminProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useProducts({ page, limit: 10, search });
  
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const bulkUpdate = useBulkUpdateProducts();
  const [uploadReport, setUploadReport] = useState<{ successCount: number; errorRows: any[] } | null>(null);

  const handleCsvUpload = () => {
    if (!csvFile) return;
    bulkUpdate.mutate(csvFile, {
      onSuccess: (report) => {
        setUploadReport(report);
        toast.success(`Updated ${report.successCount} products successfully.`);
        setCsvFile(null);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error || "CSV upload failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Products</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => { setIsCsvModalOpen(true); setUploadReport(null); }} className="flex items-center space-x-2">
            <Upload size={18} />
            <span>Bulk Update (CSV)</span>
          </Button>
          <Button className="flex items-center space-x-2">
            <Plus size={18} />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
            Loading products...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">SKU</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items?.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-10 h-10 bg-slate-100 rounded flex-shrink-0 overflow-hidden">
                          {product.images?.[0] ? (
                            <Image src={product.images[0].url} alt={product.name} fill sizes="40px" className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Box size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 line-clamp-1">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.brand || "No brand"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.sku}</td>
                    <td className="px-6 py-4 text-sm font-medium">₹{product.specialPrice || product.basePrice}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.stockStatus === 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {product.stockStatus === 1 ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="p-2 text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-slate-100">
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm text-slate-500">
              Showing page {data.page} of {data.totalPages} ({data.totalCount} total)
            </span>
            <div className="flex space-x-2">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button variant="outline" disabled={page === data.totalPages} onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Bulk Update Products (CSV)"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Upload a CSV file to bulk update stock and pricing. The CSV must have a header row with <code>sku</code>.
            Optional columns: <code>basePrice</code>, <code>specialPrice</code>, <code>stockStatus</code> (0 or 1).
          </p>
          
          {!uploadReport ? (
            <>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="w-full p-2 border border-slate-300 rounded"
              />
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setIsCsvModalOpen(false)}>Cancel</Button>
                <Button 
                  disabled={!csvFile || bulkUpdate.isPending} 
                  onClick={handleCsvUpload}
                >
                  {bulkUpdate.isPending ? "Uploading..." : "Upload & Process"}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
                <h4 className="font-semibold">Update Complete</h4>
                <p>Successfully updated {uploadReport.successCount} products.</p>
              </div>
              
              {uploadReport.errorRows?.length > 0 && (
                <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 max-h-60 overflow-y-auto">
                  <h4 className="font-semibold mb-2">{uploadReport.errorRows.length} Errors Found</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {uploadReport.errorRows.map((err, i) => (
                      <li key={i}>Row {err.row}: {err.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex justify-end pt-2">
                <Button onClick={() => setIsCsvModalOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
