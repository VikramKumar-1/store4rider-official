"use client";

import React, { useState } from "react";
import { 
  useWarehouses, 
  useCreateWarehouse, 
  useUpdateWarehouse, 
  useDeleteWarehouse, 
  useSetDefaultWarehouse,
  useSyncShiprocketWarehouses
} from "@/core/hooks/useWarehouses";
import { IWarehouse } from "@store4riders/shared-types";
import { BuildingStorefrontIcon, PencilIcon, TrashIcon, CheckBadgeIcon, PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon as CheckBadgeIconSolid } from "@heroicons/react/24/solid";
import { toast } from "sonner";

export const WarehouseManager = () => {
  const { data: warehouses, isLoading } = useWarehouses();
  const deleteMutation = useDeleteWarehouse();
  const updateMutation = useUpdateWarehouse();
  const setDefaultMutation = useSetDefaultWarehouse();
  const syncShiprocketMutation = useSyncShiprocketWarehouses();
  
  const [editingWarehouse, setEditingWarehouse] = useState<Partial<IWarehouse> | null>(null);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this warehouse?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultMutation.mutate(id);
  };

  const handleToggleActive = (wh: IWarehouse) => {
    const id = wh.id || String((wh as any)._id);
    const newStatus = wh.isActive === false ? true : false;
    updateMutation.mutate(
      { id, data: { isActive: newStatus } },
      {
        onSuccess: () => {
          toast.success(newStatus ? `"${wh.name}" is now Active` : `"${wh.name}" is now Disabled (hidden from dispatch)`);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || err.message || "Failed to update warehouse status");
        }
      }
    );
  };

  const handleSyncShiprocket = () => {
    syncShiprocketMutation.mutate(undefined, {
      onSuccess: (data: any) => {
        toast.success(data?.message || "Successfully imported warehouse pickup locations from Shiprocket!");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || err.message || "Failed to import pickup locations from Shiprocket");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-neutral-200 shadow-sm rounded-lg">
        <div>
          <h2 className="text-lg font-black text-neutral-900 uppercase">Warehouse Management</h2>
          <p className="text-xs text-neutral-500">Manage pickup locations and import registered addresses directly from Shiprocket.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={handleSyncShiprocket}
            disabled={syncShiprocketMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded transition-colors shadow-sm cursor-pointer"
          >
            <ArrowPathIcon className={`w-4 h-4 ${syncShiprocketMutation.isPending ? "animate-spin" : ""}`} />
            <span>{syncShiprocketMutation.isPending ? "Importing..." : "Sync from Shiprocket"}</span>
          </button>
          <button 
            type="button"
            onClick={() => setEditingWarehouse({ country: "India" })}
            className="bg-brand text-white px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded hover:bg-brand/90 transition-colors shadow-sm cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Warehouse</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-neutral-500 animate-pulse bg-white border border-neutral-200 rounded-lg">Loading warehouses...</div>
      ) : warehouses?.length === 0 ? (
        <div className="p-12 text-center bg-white border border-neutral-200 rounded-lg space-y-3">
          <BuildingStorefrontIcon className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="font-bold text-neutral-700">No warehouses configured yet</h3>
          <p className="text-neutral-500 text-xs max-w-sm mx-auto">
            You can either import pickup addresses already registered in your Shiprocket account or add a warehouse manually.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={handleSyncShiprocket}
              disabled={syncShiprocketMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowPathIcon className={`w-4 h-4 ${syncShiprocketMutation.isPending ? "animate-spin" : ""}`} />
              <span>Import from Shiprocket</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {warehouses?.map((wh) => {
            const isWhActive = wh.isActive !== false;
            return (
              <div 
                key={wh.id || String(wh._id)} 
                className={`relative bg-white border ${
                  wh.isDefault 
                    ? "border-brand shadow-md" 
                    : isWhActive 
                    ? "border-neutral-200 shadow-sm" 
                    : "border-slate-300 border-dashed bg-slate-50/70 opacity-75 shadow-none"
                } p-5 rounded-lg flex flex-col justify-between transition-all`}
              >
                <div>
                  {wh.isDefault && (
                    <div className="absolute -top-3 -right-3 bg-brand text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow flex items-center gap-1">
                      <CheckBadgeIconSolid className="w-3 h-3" /> Default Pickup
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-3 border-b border-neutral-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-neutral-900 text-base uppercase tracking-tight flex items-center gap-2">
                          <span>{wh.name}</span>
                          {wh.warehouseCode && (
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal normal-case">
                              {wh.warehouseCode}
                            </span>
                          )}
                        </h3>
                        {/* Active / Disabled Status Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(wh)}
                          disabled={wh.isDefault}
                          title={wh.isDefault ? "Default warehouse cannot be disabled" : isWhActive ? "Click to Disable (Hides from order dispatch dropdown)" : "Click to Enable (Shows in order dispatch dropdown)"}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                            isWhActive
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                              : "bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isWhActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                          <span>{isWhActive ? "Active" : "Disabled"}</span>
                        </button>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">{wh.contactPerson ? `${wh.contactPerson} • ` : ""}{wh.email} • {wh.phone}</p>
                      {!isWhActive && (
                        <p className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mt-1.5 inline-block">
                          🚫 Hidden from Order Dispatch Dropdown
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!wh.isDefault && (
                        <button 
                          onClick={() => handleSetDefault(wh.id || String(wh._id))}
                          title="Set as Default"
                          className="p-1.5 text-neutral-400 hover:text-brand hover:bg-orange-50 rounded transition-colors"
                        >
                          <CheckBadgeIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => setEditingWarehouse(wh)}
                        title="Edit"
                        className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(wh.id || String(wh._id))}
                        title="Delete"
                        disabled={wh.isDefault}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                
                <div className="text-xs text-neutral-700 leading-relaxed space-y-0.5">
                  <p className="font-medium text-slate-900">{wh.addressLine1}</p>
                  {wh.addressLine2 && <p className="text-slate-600">{wh.addressLine2}</p>}
                  <p className="text-slate-600">{wh.city}, {wh.state} — {wh.pincode}</p>
                  <p className="text-slate-400">{wh.country || "India"}</p>
                </div>
              </div>

              {/* Courier Mapping Badges */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px]">
                {wh.shiprocketLocationId ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold border border-orange-200">
                    <span>🚀 Shiprocket:</span>
                    <span className="font-mono">{wh.shiprocketLocationId}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                    No Shiprocket Nickname
                  </span>
                )}
                {wh.delhiveryWarehouseName && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-medium">
                    <span>DLV:</span>
                    <span className="font-mono">{wh.delhiveryWarehouseName}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Editor Modal */}
      {editingWarehouse && (
        <WarehouseEditorModal 
          warehouse={editingWarehouse} 
          onClose={() => setEditingWarehouse(null)} 
        />
      )}
    </div>
  );
};

const WarehouseEditorModal = ({ warehouse, onClose }: { warehouse: Partial<IWarehouse>, onClose: () => void }) => {
  const isEditing = !!(warehouse.id || warehouse._id);
  const [formData, setFormData] = useState(warehouse);
  
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate({ id: String(warehouse.id || warehouse._id), data: formData }, {
        onSuccess: onClose
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: onClose
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
          <h2 className="font-black uppercase text-neutral-900 tracking-tight">
            {isEditing ? "Edit Warehouse" : "Add New Warehouse"}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Warehouse Name</label>
              <input required name="name" placeholder="e.g. Kolkata Hub" value={formData.name || ""} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Warehouse Code (Unique)</label>
              <input required name="warehouseCode" placeholder="e.g. WH-KOL-01" value={formData.warehouseCode || ""} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Contact Person</label>
              <input required name="contactPerson" placeholder="e.g. Warehouse Manager" value={formData.contactPerson || ""} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Phone</label>
              <input required name="phone" placeholder="e.g. 9876543210" value={formData.phone || ""} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
            </div>

            <div className="col-span-2">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Email</label>
              <input required type="email" name="email" placeholder="e.g. kolkata@store4riders.com" value={formData.email || ""} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
            </div>
            
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Address Line 1</label>
              <input required name="addressLine1" value={formData.addressLine1 || ""} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
            </div>
            
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Address Line 2 (Optional)</label>
              <input name="addressLine2" value={formData.addressLine2 || ""} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase">City</label>
              <input required name="city" value={formData.city || ""} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase">State</label>
              <input required name="state" value={formData.state || ""} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Pincode</label>
              <input required name="pincode" placeholder="6 digits" value={formData.pincode || ""} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Country</label>
              <input required name="country" value={formData.country || "India"} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" />
            </div>

            {/* Courier Integrations Section */}
            <div className="col-span-2 pt-3 border-t border-neutral-100">
              <h4 className="text-xs font-black uppercase text-neutral-800 tracking-wider mb-2">Courier Gateway Mappings</h4>
              <p className="text-[11px] text-neutral-500 mb-3">Map this warehouse to the exact pickup location names configured in your courier accounts.</p>
            </div>

            <div className="col-span-2">
              <label className="text-[10px] font-bold text-neutral-600 uppercase flex items-center justify-between">
                <span>Shiprocket Pickup Location Nickname</span>
                <span className="text-[9px] text-neutral-400 font-normal">Matches Shiprocket Dashboard Name</span>
              </label>
              <input 
                name="shiprocketLocationId" 
                placeholder="e.g. Kolkata_Hub or Primary" 
                value={formData.shiprocketLocationId || ""} 
                onChange={handleChange} 
                className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none bg-orange-50/20" 
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-600 uppercase">Delhivery Facility Name</label>
              <input 
                name="delhiveryWarehouseName" 
                placeholder="e.g. Kolkata_Facility" 
                value={formData.delhiveryWarehouseName || ""} 
                onChange={handleChange} 
                className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" 
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-neutral-600 uppercase">Xpressbees Warehouse ID</label>
              <input 
                name="xpressbeesWarehouseId" 
                placeholder="e.g. XB_KOL_01" 
                value={formData.xpressbeesWarehouseId || ""} 
                onChange={handleChange} 
                className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:border-brand focus:outline-none" 
              />
            </div>

            {/* Active Status Checkbox */}
            <div className="col-span-2 pt-2 border-t border-neutral-100 flex items-center gap-2">
              <input 
                type="checkbox" 
                id="modalIsActive" 
                name="isActive" 
                checked={formData.isActive !== false} 
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} 
                className="w-4 h-4 text-brand rounded border-neutral-300 focus:ring-brand cursor-pointer" 
              />
              <label htmlFor="modalIsActive" className="text-xs font-bold text-neutral-800 select-none cursor-pointer">
                Active Warehouse (Display in order fulfillment dropdown)
              </label>
            </div>
          </div>
          
          <div className="mt-4 flex gap-3 justify-end border-t border-neutral-100 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-neutral-500 uppercase hover:bg-neutral-100 rounded transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="px-6 py-2 bg-brand text-white text-sm font-bold uppercase rounded hover:bg-brand/90 transition-colors disabled:opacity-50">
              {isPending ? "Saving..." : "Save Warehouse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
