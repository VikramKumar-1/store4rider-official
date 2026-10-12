"use client";

import React, { useState } from "react";
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse, useSetDefaultWarehouse } from "@/core/hooks/useWarehouses";
import { IWarehouse } from "@store4riders/shared-types";
import { BuildingStorefrontIcon, PencilIcon, TrashIcon, CheckBadgeIcon, PlusIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon as CheckBadgeIconSolid } from "@heroicons/react/24/solid";

export const WarehouseManager = () => {
  const { data: warehouses, isLoading } = useWarehouses();
  const deleteMutation = useDeleteWarehouse();
  const setDefaultMutation = useSetDefaultWarehouse();
  
  const [editingWarehouse, setEditingWarehouse] = useState<Partial<IWarehouse> | null>(null);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this warehouse?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultMutation.mutate(id);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white p-4 border border-neutral-200 shadow-sm rounded-lg">
        <div>
          <h2 className="text-lg font-black text-neutral-900 uppercase">Warehouse Management</h2>
          <p className="text-xs text-neutral-500">Manage pickup locations for your couriers.</p>
        </div>
        <button 
          onClick={() => setEditingWarehouse({ country: "India" })}
          className="bg-brand text-white px-4 py-2 text-sm font-bold uppercase flex items-center gap-2 rounded hover:bg-brand/90 transition-colors"
        >
          <PlusIcon className="w-4 h-4" /> Add Warehouse
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-neutral-500 animate-pulse bg-white border border-neutral-200 rounded-lg">Loading warehouses...</div>
      ) : warehouses?.length === 0 ? (
        <div className="p-12 text-center bg-white border border-neutral-200 rounded-lg">
          <BuildingStorefrontIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No warehouses configured yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {warehouses?.map((wh) => (
            <div key={wh.id || String(wh._id)} className={`relative bg-white border ${wh.isDefault ? "border-brand shadow-md" : "border-neutral-200 shadow-sm"} p-5 rounded-lg flex flex-col`}>
              {wh.isDefault && (
                <div className="absolute -top-3 -right-3 bg-brand text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow flex items-center gap-1">
                  <CheckBadgeIconSolid className="w-3 h-3" /> Default Pickup
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4 border-b border-neutral-100 pb-3">
                <div>
                  <h3 className="font-bold text-neutral-900 text-lg uppercase tracking-tight">{wh.name}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">{wh.email} • {wh.phone}</p>
                </div>
                <div className="flex items-center gap-1">
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
              
              <div className="text-sm text-neutral-700 leading-relaxed">
                <p>{wh.addressLine1}</p>
                {wh.addressLine2 && <p>{wh.addressLine2}</p>}
                <p>{wh.city}, {wh.state} {wh.pincode}</p>
                <p>{wh.country}</p>
              </div>
            </div>
          ))}
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
