"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/core/api/client";
import { toast } from "sonner";
import Button from "@/components/ui/Button";

interface ISettings {
  taxRate: number;
  freeShippingThreshold: number;
  shippingCost: number;
  enabledGateways: string[];
  codPartialPaymentEnabled?: boolean;
  codPartialPaymentType: "percentage" | "fixed";
  codPartialPaymentValue: number;
}

export function AdminPaymentSettings() {
  const [settings, setSettings] = useState<ISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get("/admin/settings");
      setSettings(res.data.data);
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await apiClient.get("/admin/payment-logs");
      setLogs(res.data.data.items || res.data.data);
    } catch (err) {
      toast.error("Failed to load payment logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const { _id, __v, createdAt, updatedAt, id, ...payload } = settings as any;
      await apiClient.put("/admin/settings", payload);
      toast.success("Settings saved successfully");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to save settings";
      toast.error(typeof msg === "string" ? msg : "Failed to save settings");
    }
  };

  const handleGatewayToggle = (gateway: string) => {
    if (!settings) return;
    const currentGateways = settings.enabledGateways || [];
    const enabled = currentGateways.includes(gateway);
    let newGateways = [...currentGateways];
    if (enabled) {
      if (newGateways.length <= 1) {
        toast.error("At least one payment gateway must remain enabled.");
        return;
      }
      newGateways = newGateways.filter((g) => g !== gateway);
    } else {
      newGateways.push(gateway);
    }
    setSettings({ ...settings, enabledGateways: newGateways });
  };

  if (loading) {
    return <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>;
  }

  if (!settings) return null;

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Payment & Gateway Config</h2>
        <form onSubmit={handleSave} className="space-y-4 max-w-lg">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enabled Gateways</label>
            <div className="flex flex-wrap gap-4">
              {["upi", "payu", "ccavenue", "snapmint", "cod"].map((gw) => (
                <label key={gw} className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-brand"
                    checked={(settings?.enabledGateways || []).includes(gw)}
                    onChange={() => handleGatewayToggle(gw)}
                  />
                  <span className="ml-2 uppercase text-sm font-semibold">{gw}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold text-md mb-2">COD Configuration</h3>
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="codPartialPaymentEnabled"
                className="rounded text-brand mr-2"
                checked={Boolean(settings.codPartialPaymentEnabled)}
                onChange={(e) => setSettings({ ...settings, codPartialPaymentEnabled: e.target.checked })}
              />
              <label htmlFor="codPartialPaymentEnabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                Require Partial Online Advance for COD Orders
              </label>
            </div>
            {settings.codPartialPaymentEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-4 bg-neutral-50 border border-neutral-200">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Partial Payment Type
                  </label>
                  <select 
                    className="w-full border border-neutral-300 rounded p-2.5 text-sm bg-white"
                    value={settings.codPartialPaymentType || "percentage"}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      codPartialPaymentType: e.target.value as "percentage" | "fixed" 
                    })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Advance Value {settings.codPartialPaymentType === "percentage" ? "(%)" : "(₹)"}
                  </label>
                  <input 
                    type="number"
                    min={0}
                    max={settings.codPartialPaymentType === "percentage" ? 100 : undefined}
                    step={settings.codPartialPaymentType === "percentage" ? 1 : 10}
                    placeholder="Enter advance amount"
                    className="w-full border border-neutral-300 rounded p-2.5 text-sm"
                    value={settings.codPartialPaymentValue ?? 0}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      let val = isNaN(num) ? 0 : Math.max(0, num);
                      if (settings.codPartialPaymentType === "percentage") {
                        val = Math.min(100, val);
                      }
                      setSettings({ ...settings, codPartialPaymentValue: val });
                    }}
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    {settings.codPartialPaymentType === "percentage"
                      ? "Percentage of total order amount customer pays online (0-100%)."
                      : "Fixed ₹ amount customer pays online as advance to confirm COD."}
                  </span>
                </div>

                {/* Live Partial COD Example Pill */}
                <div className="col-span-1 sm:col-span-2 p-3 bg-white border border-neutral-200 rounded text-xs space-y-1 shadow-2xs">
                  <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                    💡 Customer COD Order Example (Sample Order Total ₹5,000):
                  </span>
                  <div className="flex flex-wrap gap-4 text-[11px] text-neutral-700 pt-0.5">
                    <span>
                      Online Advance to Pay Now:{" "}
                      <strong className="text-brand font-black">
                        ₹
                        {settings.codPartialPaymentType === "percentage"
                          ? Math.round((5000 * (settings.codPartialPaymentValue || 0)) / 100)
                          : Math.min(5000, settings.codPartialPaymentValue || 0)}
                      </strong>
                    </span>
                    <span>
                      Balance Due on Doorstep Delivery:{" "}
                      <strong className="text-emerald-700 font-black">
                        ₹
                        {settings.codPartialPaymentType === "percentage"
                          ? Math.max(
                              0,
                              5000 - Math.round((5000 * (settings.codPartialPaymentValue || 0)) / 100)
                            )
                          : Math.max(0, 5000 - (settings.codPartialPaymentValue || 0))}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit">Save Payment & COD Settings</Button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Payment Logs</h2>
        {logsLoading ? (
          <p>Loading logs...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="p-3">ID / Gateway ID</th>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Gateway</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b">
                    <td className="p-3 font-mono text-xs">{log.gatewayOrderId || log._id}</td>
                    <td className="p-3 font-mono text-xs">{log.orderId}</td>
                    <td className="p-3 uppercase">{log.gateway}</td>
                    <td className="p-3">₹{log.amount}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold 
                        ${log.status === 'captured' ? 'bg-green-100 text-green-800' : 
                          log.status === 'failed' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && <p className="text-gray-500 mt-4">No payment logs found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
