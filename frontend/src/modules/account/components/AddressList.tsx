"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema } from "@store4riders/shared-validation";
import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { MapPin, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { IUserAddress } from "@store4riders/shared-types";

export function AddressList() {
  const { user, setUser } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<IUserAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue, clearErrors } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      isDefault: false
    }
  });

  const pincodeValue = watch("pincode");

  useEffect(() => {
    if (pincodeValue && pincodeValue.length === 6 && /^\d+$/.test(pincodeValue)) {
      const fetchPincodeDetails = async () => {
        try {
          const res = await apiClient.get(`/pincodes/${pincodeValue}`);
          if (res.data?.success && res.data?.data) {
            const data = res.data.data;
            // Map the postal data to the form fields
            const cityName = data.district || data.regionName || data.divisionName || "";
            const stateName = data.state || "";
            
            if (cityName) setValue("city", cityName, { shouldValidate: true });
            if (stateName) setValue("state", stateName, { shouldValidate: true });
            
            // Auto-detect country as India since this is an Indian pincode db
            setValue("country", "India", { shouldValidate: true });
            
            clearErrors(["city", "state", "country"]);
            toast.success(`Location detected: ${cityName}, ${stateName}`);
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
             toast.error("Pincode not found. Please enter details manually.");
          }
        }
      };
      fetchPincodeDetails();
    }
  }, [pincodeValue, setValue, clearErrors]);

  const openAddModal = () => {
    setEditingAddress(null);
    reset({ street: "", city: "", state: "", pincode: "", country: "India", isDefault: false });
    setIsModalOpen(true);
  };

  const openEditModal = (addr: IUserAddress) => {
    setEditingAddress(addr);
    reset({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
      isDefault: addr.isDefault
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: z.infer<typeof addressSchema>) => {
    setIsSubmitting(true);
    try {
      if (editingAddress) {
        const res = await apiClient.put(`/users/me/addresses/${editingAddress.id}`, data);
        setUser(res.data.data);
        toast.success("Address updated successfully");
      } else {
        const res = await apiClient.post("/users/me/addresses", data);
        setUser(res.data.data);
        toast.success("Address added successfully");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    setDeletingId(id);
    try {
      const res = await apiClient.delete(`/users/me/addresses/${id}`);
      setUser(res.data.data);
      toast.success("Address deleted successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (addr: IUserAddress) => {
    if (addr.isDefault) return;
    try {
      const res = await apiClient.put(`/users/me/addresses/${addr.id}`, { isDefault: true });
      setUser(res.data.data);
      toast.success("Default address updated");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update default address");
    }
  };

  return (
    <>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">My Addresses</h1>
          <p className="text-zinc-500">Manage your delivery addresses for faster checkout.</p>
        </div>
        <Button onClick={openAddModal}>+ Add New Address</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {user?.addresses?.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-12 bg-white rounded-2xl shadow-sm border border-zinc-200">
            <MapPin className="mx-auto text-zinc-300 mb-3" size={48} strokeWidth={1} />
            <h3 className="text-lg font-semibold text-zinc-900">No addresses saved yet</h3>
            <p className="text-zinc-500 mb-6">Add a delivery address to make checkout faster.</p>
            <Button variant="outline" onClick={openAddModal}>Add Address</Button>
          </div>
        )}
        
        {user?.addresses?.map(addr => (
          <div key={addr.id} className={`bg-white p-6 rounded-2xl border relative group transition-all duration-300 ${addr.isDefault ? 'border-brand shadow-md ring-1 ring-brand/10' : 'border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md'}`}>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                {addr.isDefault ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-brand font-bold uppercase tracking-wider bg-brand/10 px-2.5 py-1 rounded-full border border-brand/20">
                    <CheckCircle2 size={12} strokeWidth={2.5} /> Default
                  </span>
                ) : (
                  <button 
                    onClick={() => handleSetDefault(addr)}
                    className="text-[11px] text-zinc-400 hover:text-brand font-bold uppercase tracking-wider transition-colors px-2.5 py-1 border border-transparent hover:border-brand/20 hover:bg-brand/5 rounded-full"
                  >
                    Set as Default
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal(addr)} className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-white hover:text-brand hover:border-brand/30 transition-all shadow-sm">
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(addr.id)} 
                  disabled={deletingId === addr.id}
                  className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="space-y-1 mt-2">
              <p className="font-bold text-zinc-900 text-lg leading-tight">{addr.street}</p>
              <p className="text-zinc-600 font-medium">{addr.city}, {addr.state} {addr.pincode}</p>
              <p className="text-sm text-zinc-400 font-medium">{addr.country}</p>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAddress ? "Edit Address" : "Add New Address"}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <Input label="Street Address" {...register("street")} error={errors.street?.message as string} placeholder="123 Main St, Apt 4B" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Input label="City" {...register("city")} error={errors.city?.message as string} />
            </div>
            <div>
              <Input label="State" {...register("state")} error={errors.state?.message as string} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Input label="Pincode" {...register("pincode")} error={errors.pincode?.message as string} />
            </div>
            <div>
              <Input label="Country" {...register("country")} error={errors.country?.message as string} />
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-1 bg-zinc-50 p-4 rounded-xl border border-zinc-200 hover:border-brand/30 transition-colors cursor-pointer group">
            <input 
              type="checkbox" 
              id="isDefault" 
              {...register("isDefault")} 
              className="w-5 h-5 text-brand rounded border-zinc-300 focus:ring-brand focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="isDefault" className="text-sm font-semibold text-zinc-800 cursor-pointer group-hover:text-brand transition-colors w-full">Set as my default delivery address</label>
          </div>

          <div className="pt-5 mt-2 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-zinc-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto px-8">{editingAddress ? "Save Changes" : "Add Address"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
