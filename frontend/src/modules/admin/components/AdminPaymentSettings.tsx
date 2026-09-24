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
      await apiClient.put("/admin/settings", settings);
      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error("Failed to save settings");
    }
  };

  const handleGatewayToggle = (gateway: string) => {
    if (!settings) return;
    const enabled = settings.enabledGateways.includes(gateway);
    let newGateways = [...settings.enabledGateways];
    if (enabled) {
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
            <div className="space-x-4">
              {["payu", "ccavenue", "snapmint", "cod"].map((gw) => (
                <label key={gw} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded text-brand"
                    checked={settings.enabledGateways.includes(gw)}
                    onChange={() => handleGatewayToggle(gw)}
                  />
                  <span className="ml-2 uppercase text-sm">{gw}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold text-md mb-2">COD Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partial Payment Type</label>
                <select 
                  className="w-full border rounded p-2"
                  value={settings.codPartialPaymentType}
                  onChange={(e) => setSettings({ ...settings, codPartialPaymentType: e.target.value as "percentage" | "fixed" })}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <input 
                  type="number"
                  className="w-full border rounded p-2"
                  value={settings.codPartialPaymentValue}
                  onChange={(e) => setSettings({ ...settings, codPartialPaymentValue: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="mt-4">Save Settings</Button>
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
