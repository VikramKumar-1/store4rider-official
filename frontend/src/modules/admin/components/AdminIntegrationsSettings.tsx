"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { LockClosedIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export function AdminIntegrationsSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/settings");
      return res.data.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.put("/admin/settings", data);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Integrations updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to update settings");
    }
  });

  const [formData, setFormData] = useState<any>({});
  
  // Sync form data when settings load
  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading secure settings...</div>;

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
      
      <div className="flex items-center gap-3 bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-200">
        <LockClosedIcon className="w-6 h-6 flex-shrink-0 text-blue-600" />
        <div className="text-sm">
          <p className="font-bold uppercase tracking-wider">Enterprise Security Active</p>
          <p className="mt-0.5">All secret keys saved here are encrypted via AES-256 in the database. For security, existing keys are masked as <span className="font-mono bg-blue-100 px-1 rounded">••••••••</span>. To update a key, replace the masked text with your new key.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Shipping Integrations */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
            <h2 className="text-lg font-black text-neutral-900 uppercase">Shipping Integrations</h2>
            <p className="text-xs text-neutral-500">Configure your logistics partners for automated fulfillment.</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-neutral-700 flex items-center gap-2">
                Shiprocket
                {settings?.shiprocketPassword && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">API User Email</label>
                  <input type="text" name="shiprocketEmail" value={formData.shiprocketEmail || ""} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" placeholder="apiuser@example.com" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1 flex justify-between">
                    <span>API Password (Encrypted)</span>
                  </label>
                  <input type="password" name="shiprocketPassword" value={formData.shiprocketPassword || ""} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none font-mono" placeholder="No key configured" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1 flex justify-between">
                    <span>Pickup Location ID</span>
                  </label>
                  <input type="text" name="shiprocketPickupLocation" value={formData.shiprocketPickupLocation || ""} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none font-mono" placeholder="e.g. Primary" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <h3 className="font-bold text-neutral-700 flex items-center gap-2">
                Delhivery Direct
                {settings?.delhiveryApiKey && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">API Token (Encrypted)</label>
                  <input type="password" name="delhiveryApiKey" value={formData.delhiveryApiKey || ""} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none font-mono" placeholder="No token configured" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Exact Client Name</label>
                  <input type="text" name="delhiveryClientName" value={formData.delhiveryClientName || ""} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" placeholder="Case-sensitive" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Pickup Location Name</label>
                  <input type="text" name="delhiveryPickupLocation" value={formData.delhiveryPickupLocation || ""} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" placeholder="e.g. Warehouse1" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <h3 className="font-bold text-neutral-700 flex items-center gap-2">
                Xpressbees Direct
                {settings?.xpressbeesPassword && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">API Username / Email</label>
                  <input type="text" name="xpressbeesEmail" value={formData.xpressbeesEmail || ""} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">API Password / Token (Encrypted)</label>
                  <input type="password" name="xpressbeesPassword" value={formData.xpressbeesPassword || ""} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none font-mono" placeholder="No key configured" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Client / Account ID</label>
                  <input type="text" name="xpressbeesAccountId" value={formData.xpressbeesAccountId || ""} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Pickup Location / Warehouse</label>
                  <input type="text" name="xpressbeesPickupLocation" value={formData.xpressbeesPickupLocation || ""} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Integrations */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-neutral-900 uppercase">Payment Gateways</h2>
              <p className="text-xs text-neutral-500">Securely configure your payment processors.</p>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-neutral-300 shadow-sm">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Environment</label>
              <select 
                name="paymentEnvironment"
                value={formData.paymentEnvironment || "test"}
                onChange={handleChange}
                className="text-sm font-bold bg-transparent focus:outline-none"
              >
                <option value="test">TEST MODE</option>
                <option value="live">LIVE MODE</option>
              </select>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-neutral-700 flex items-center gap-2">
                PayU
                {settings?.payuSalt && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Merchant Key ({formData.paymentEnvironment || "test"})</label>
                  <input type="text" name="payuMerchantKey" value={formData.payuMerchantKey || ""} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" placeholder="e.g. gT3s..." />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Salt ({formData.paymentEnvironment || "test"}) (Encrypted)</label>
                  <input type="password" name="payuSalt" value={formData.payuSalt || ""} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none font-mono" placeholder="No salt configured" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <h3 className="font-bold text-neutral-700 flex items-center gap-2">
                CCAvenue
                {settings?.ccavenueWorkingKey && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Merchant ID ({formData.paymentEnvironment || "test"})</label>
                  <input type="text" name="ccavenueMerchantId" value={formData.ccavenueMerchantId || ""} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Access Code</label>
                  <input type="text" name="ccavenueAccessCode" value={formData.ccavenueAccessCode || ""} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">Working Key (Encrypted)</label>
                  <input type="password" name="ccavenueWorkingKey" value={formData.ccavenueWorkingKey || ""} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none font-mono" placeholder="No key configured" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={updateMutation.isPending} className="bg-brand text-white px-8 py-3 rounded text-sm font-black uppercase tracking-wider hover:bg-brand/90 transition-colors disabled:opacity-50 shadow-md">
            {updateMutation.isPending ? "Encrypting & Saving..." : "Save Integrations"}
          </button>
        </div>

      </form>
    </div>
  );
}
