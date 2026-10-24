"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  useAdminUsers, 
  useUpdateUserRole, 
  useUpdateUserStatus,
  useCreateStaffUser,
  useDeleteAdminUser
} from "@/core/hooks/useAdminUsers";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import Link from "next/link";
import { 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  Search, 
  Users, 
  UserCheck, 
  AlertTriangle,
  Truck,
  Headphones,
  ShoppingBag,
  Power,
  PowerOff,
  CheckCircle2,
  Lock
} from "lucide-react";

const STAFF_ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "logistic", label: "Logistics Team" },
  { value: "customer_care", label: "Customer Care" },
];

const getRoleDisplay = (role: string) => {
  switch (role) {
    case "super_admin":
      return { label: "Super Admin", color: "bg-red-50 text-red-700 border-red-200", icon: ShieldAlert };
    case "admin":
      return { label: "Administrator", color: "bg-blue-50 text-blue-700 border-blue-200", icon: ShieldCheck };
    case "logistic":
      return { label: "Logistics Team", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Truck };
    case "customer_care":
      return { label: "Customer Care", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Headphones };
    case "customer":
      return { label: "Customer", color: "bg-slate-100 text-slate-700 border-slate-200", icon: UserCheck };
    default:
      return { label: role.replace("_", " ").toUpperCase(), color: "bg-slate-100 text-slate-700 border-slate-200", icon: Users };
  }
};

export function AdminUsers() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTabFromUrl = searchParams.get("tab") === "customers" ? "customers" : "staff";
  
  const [activeTab, setActiveTab] = useState<"staff" | "customers">(activeTabFromUrl);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "customers" || tabParam === "staff") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: "staff" | "customers") => {
    setActiveTab(tab);
    router.replace(`/admin/users?tab=${tab}`);
  };

  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === "super_admin";
  const isAdminOrSuperAdmin = currentUser?.role === "admin" || isSuperAdmin;

  // Staff Tab States
  const [staffPage, setStaffPage] = useState(1);
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>("");
  const [staffSearch, setStaffSearch] = useState("");
  const [debouncedStaffSearch, setDebouncedStaffSearch] = useState("");
  const limit = 20;

  // Customers Tab States
  const [custPage, setCustPage] = useState(1);
  const [custSearch, setCustSearch] = useState("");
  const [debouncedCustSearch, setDebouncedCustSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedStaffSearch(staffSearch.trim());
      setStaffPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [staffSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCustSearch(custSearch.trim());
      setCustPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [custSearch]);

  // Loading state tracking for specific user ID during status toggle
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Queries
  const { data: staffData, isLoading: isStaffLoading } = useAdminUsers(
    staffPage, 
    limit, 
    staffRoleFilter || "staff", 
    debouncedStaffSearch || undefined
  );

  const { data: custData, isLoading: isCustLoading } = useAdminUsers(
    custPage, 
    limit, 
    "customer", 
    debouncedCustSearch || undefined
  );

  // Mutations
  const { mutate: updateRole, isPending: updatingRole } = useUpdateUserRole();
  const { mutate: updateStatus } = useUpdateUserStatus();
  const { mutate: createStaff, isPending: creatingStaff } = useCreateStaffUser();
  const { mutate: deleteUser, isPending: deletingUser } = useDeleteAdminUser();

  // Add Staff Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "logistic" as "logistic" | "customer_care" | "admin"
  });

  // Delete User Modal
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string; role: string } | null>(null);

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRole({ userId, role: newRole }, {
      onSuccess: () => toast.success("Role updated successfully"),
      onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to update role")
    });
  };

  const handleStatusToggle = (userId: string, currentStatus: boolean | undefined) => {
    // If currentStatus is explicitly false -> newStatus is true (activate).
    // If currentStatus is true or undefined -> newStatus is false (disable).
    const isCurrentlyActive = currentStatus !== false;
    const targetStatus = !isCurrentlyActive;
    setUpdatingUserId(userId);

    updateStatus({ userId, isActive: targetStatus }, {
      onSuccess: () => {
        toast.success(`Account successfully ${targetStatus ? 'activated (Active)' : 'disabled'}`);
        setUpdatingUserId(null);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || "Failed to update status");
        setUpdatingUserId(null);
      }
    });
  };

  const handleCreateStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.firstName.trim() || !staffForm.email.trim() || !staffForm.password) {
      toast.error("Please fill in First Name, Email, and Password");
      return;
    }
    if (staffForm.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    createStaff(staffForm, {
      onSuccess: () => {
        toast.success(`Staff user created successfully with role ${staffForm.role.toUpperCase()}`);
        setIsAddModalOpen(false);
        setStaffForm({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          phone: "",
          role: "logistic"
        });
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || "Failed to create staff member");
      }
    });
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete.id, {
      onSuccess: () => {
        toast.success(`User ${userToDelete.name} deleted successfully`);
        setUserToDelete(null);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || "Failed to delete user");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
          <p className="text-slate-500 text-sm mt-1">Manage staff team members, roles, permissions, and customers</p>
        </div>

        {isAdminOrSuperAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand/90 transition shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {/* Clean Tabs Matching Admin Theme */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => handleTabChange("staff")}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === "staff"
                ? "border-brand text-brand font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Staff & Roles</span>
            {staffData?.totalCount !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === "staff" ? "bg-brand/10 text-brand font-bold" : "bg-slate-100 text-slate-600"
              }`}>
                {staffData.totalCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("customers")}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === "customers"
                ? "border-brand text-brand font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers</span>
            {custData?.totalCount !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === "customers" ? "bg-brand/10 text-brand font-bold" : "bg-slate-100 text-slate-600"
              }`}>
                {custData.totalCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STAFF & ROLES */}
      {/* ========================================================================= */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff name, email, phone..."
                value={staffSearch}
                onChange={(e) => { setStaffSearch(e.target.value); setStaffPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <label className="text-sm font-medium text-slate-600">Filter Role:</label>
              <select
                value={staffRoleFilter}
                onChange={(e) => { setStaffRoleFilter(e.target.value); setStaffPage(1); }}
                className="border-slate-200 rounded-lg text-sm px-3 py-2 border outline-none bg-white text-slate-700 focus:border-brand"
              >
                <option value="">All Staff Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Administrator</option>
                <option value="logistic">Logistics Team</option>
                <option value="customer_care">Customer Care</option>
              </select>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Staff Member</th>
                    <th className="px-6 py-4">Email & Phone</th>
                    <th className="px-6 py-4">Role Assignment</th>
                    <th className="px-6 py-4">Account Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isStaffLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                          <span>Loading staff members...</span>
                        </div>
                      </td>
                    </tr>
                  ) : staffData?.items?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No staff members found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    staffData?.items?.map((u: any) => {
                      const targetId = u.id || u._id;
                      const currentUserId = currentUser?.id || (currentUser as any)?._id;
                      const isSelf = String(targetId) === String(currentUserId);
                      const isTargetSuperAdmin = u.role === "super_admin";
                      const isTargetAdmin = u.role === "admin";

                      // Super Admin can edit anyone except self.
                      // Admin can edit Logistic and Customer Care, but not Super Admin or another Admin.
                      const canModifyRole = !isSelf && !isTargetSuperAdmin && (isSuperAdmin || !isTargetAdmin);
                      const canToggleStatus = !isSelf && !isTargetSuperAdmin && (isSuperAdmin || !isTargetAdmin);
                      const canDelete = !isSelf && !isTargetSuperAdmin && (isSuperAdmin || !isTargetAdmin);

                      const roleBadge = getRoleDisplay(u.role);
                      const RoleIcon = roleBadge.icon;
                      const isUserActive = u.isActive !== false;
                      const isThisUpdating = updatingUserId === targetId;

                      return (
                        <tr 
                          key={targetId} 
                          className={`transition-colors ${
                            !isUserActive ? "bg-red-50/25 hover:bg-red-50/35" : "hover:bg-slate-50/60"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-sm shrink-0 ${
                                !isUserActive 
                                  ? "bg-red-100/60 border-red-200 text-red-700" 
                                  : "bg-slate-100 border-slate-200 text-slate-700"
                              }`}>
                                {u.firstName?.[0] || "S"}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  {u.firstName} {u.lastName}
                                  {isSelf && (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400">
                                  Member since {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "System Staff"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-slate-900 font-medium">{u.email}</div>
                            <div className="text-xs text-slate-400">{u.phone || "No phone added"}</div>
                          </td>

                          <td className="px-6 py-4">
                            {canModifyRole ? (
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(targetId, e.target.value)}
                                disabled={updatingRole}
                                className="text-xs border border-slate-200 rounded p-1.5 font-medium text-slate-800 bg-white hover:border-slate-300 outline-none cursor-pointer"
                              >
                                {STAFF_ROLES.map(r => (
                                  <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                                {isSuperAdmin && (
                                  <option value="super_admin">Super Admin</option>
                                )}
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${roleBadge.color}`}>
                                <RoleIcon className="w-3.5 h-3.5 mr-1" />
                                {roleBadge.label}
                              </span>
                            )}
                          </td>

                          {/* Account Status Column: Interactive Toggle Switch */}
                          <td className="px-6 py-4">
                            {canToggleStatus ? (
                              <button
                                type="button"
                                onClick={() => handleStatusToggle(targetId, u.isActive)}
                                disabled={isThisUpdating}
                                className="flex items-center gap-2.5 cursor-pointer disabled:cursor-not-allowed group text-left select-none"
                                title={isUserActive ? "Click to Disable account (blocks login)" : "Click to Activate account (allows login)"}
                              >
                                {isThisUpdating ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs text-slate-400 font-medium">Updating...</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className={`w-11 h-6 rounded-full p-0.5 transition-colors relative shadow-inner ${
                                      isUserActive ? "bg-emerald-500" : "bg-slate-300"
                                    }`}>
                                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                                        isUserActive ? "translate-x-5" : "translate-x-0"
                                      }`} />
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors ${
                                      isUserActive 
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                        : "bg-red-50 text-red-700 border-red-200"
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${isUserActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                                      {isUserActive ? "Active" : "Disabled"}
                                    </span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <div className="flex items-center gap-2.5 opacity-70" title="Super Admin status is protected">
                                <div className="w-11 h-6 bg-emerald-400 rounded-full p-0.5 relative shadow-inner">
                                  <div className="w-5 h-5 bg-white rounded-full shadow-md transform translate-x-5" />
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Active (Locked)
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Action Buttons: Delete */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canDelete ? (
                                <button
                                  type="button"
                                  onClick={() => setUserToDelete({
                                    id: targetId,
                                    name: `${u.firstName} ${u.lastName || ""}`.trim(),
                                    email: u.email,
                                    role: u.role
                                  })}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                                  title="Delete Staff Member"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium italic">
                                  {isTargetSuperAdmin ? "Protected" : isSelf ? "You" : "Restricted"}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls for staff */}
            {staffData?.totalCount > limit && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Showing {(staffPage - 1) * limit + 1} to {Math.min(staffPage * limit, staffData.totalCount)} of {staffData.totalCount} staff members
                </span>
                <div className="space-x-2">
                  <button 
                    onClick={() => setStaffPage(p => Math.max(1, p - 1))}
                    disabled={staffPage === 1}
                    className="px-3 py-1 border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setStaffPage(p => p + 1)}
                    disabled={staffPage * limit >= staffData.totalCount}
                    className="px-3 py-1 border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CUSTOMERS */}
      {/* ========================================================================= */}
      {activeTab === "customers" && (
        <div className="space-y-4">
          {/* Customer Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers by name, email, phone..."
                value={custSearch}
                onChange={(e) => { setCustSearch(e.target.value); setCustPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand"
              />
            </div>
            <div className="text-sm text-slate-500 font-medium">
              {custData?.totalCount !== undefined ? `${custData.totalCount} Total Customers` : ""}
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Saved Address</th>
                    <th className="px-6 py-4">Account Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isCustLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                          <span>Loading customers...</span>
                        </div>
                      </td>
                    </tr>
                  ) : custData?.items?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No customer accounts found.
                      </td>
                    </tr>
                  ) : (
                    custData?.items?.map((c: any) => {
                      const custId = c.id || c._id;
                      const isUserActive = c.isActive !== false;
                      const defaultAddress = c.addresses?.find((a: any) => a.isDefault) || c.addresses?.[0];
                      const isThisUpdating = updatingUserId === custId;

                      return (
                        <tr 
                          key={custId} 
                          className={`transition-colors ${
                            !isUserActive ? "bg-red-50/25 hover:bg-red-50/35" : "hover:bg-slate-50/60"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                                !isUserActive 
                                  ? "bg-red-100/60 border-red-200 text-red-700" 
                                  : "bg-slate-100 border-slate-200 text-slate-700"
                              }`}>
                                {c.firstName?.[0] || "C"}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {c.firstName} {c.lastName}
                                </div>
                                <div className="text-xs text-slate-400">
                                  Joined {new Date(c.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-slate-900 font-medium">{c.email}</div>
                            <div className="text-xs text-slate-400">{c.phone || "No phone added"}</div>
                          </td>

                          <td className="px-6 py-4">
                            {defaultAddress ? (
                              <div className="text-xs text-slate-700">
                                <span className="font-medium">{defaultAddress.city}, {defaultAddress.state}</span>
                                <span className="text-slate-400 block">{defaultAddress.pincode}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No address saved</span>
                            )}
                          </td>

                          {/* Account Status Column: Interactive Toggle Switch */}
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(custId, c.isActive)}
                              disabled={isThisUpdating}
                              className="flex items-center gap-2.5 cursor-pointer disabled:cursor-not-allowed group text-left select-none"
                              title={isUserActive ? "Click to Disable customer (blocks login)" : "Click to Activate customer (allows login)"}
                            >
                              {isThisUpdating ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs text-slate-400 font-medium">Updating...</span>
                                </div>
                              ) : (
                                <>
                                  <div className={`w-11 h-6 rounded-full p-0.5 transition-colors relative shadow-inner ${
                                    isUserActive ? "bg-emerald-500" : "bg-slate-300"
                                  }`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                                      isUserActive ? "translate-x-5" : "translate-x-0"
                                    }`} />
                                  </div>
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors ${
                                    isUserActive 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                      : "bg-red-50 text-red-700 border-red-200"
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isUserActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                                    {isUserActive ? "Active" : "Disabled"}
                                  </span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Action Buttons: View Orders */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end">
                              <Link
                                href={`/admin/orders?search=${encodeURIComponent(c.email)}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand hover:border-slate-300 transition shadow-2xs"
                              >
                                <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                                <span>View Orders</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls for customers */}
            {custData?.totalCount > limit && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Showing {(custPage - 1) * limit + 1} to {Math.min(custPage * limit, custData.totalCount)} of {custData.totalCount} customers
                </span>
                <div className="space-x-2">
                  <button 
                    onClick={() => setCustPage(p => Math.max(1, p - 1))}
                    disabled={custPage === 1}
                    className="px-3 py-1 border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setCustPage(p => p + 1)}
                    disabled={custPage * limit >= custData.totalCount}
                    className="px-3 py-1 border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD STAFF MEMBER */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Add New Staff Member</h3>
                <p className="text-xs text-slate-500">Assign role and grant operational access</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaffSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={staffForm.firstName}
                    onChange={(e) => setStaffForm({ ...staffForm, firstName: e.target.value })}
                    placeholder="e.g. Rahul"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={staffForm.lastName}
                    onChange={(e) => setStaffForm({ ...staffForm, lastName: e.target.value })}
                    placeholder="e.g. Sharma"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-brand outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="e.g. logistics@store4riders.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Password * (Min 6 Characters)
                </label>
                <input
                  type="password"
                  required
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Role Assignment *
                </label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:border-brand outline-none bg-white text-slate-800"
                >
                  <option value="logistic">Logistics Team (Order Packing, Dispatch & Exchange)</option>
                  <option value="customer_care">Customer Care (Order Lookup, Tracking & Cancellation)</option>
                  <option value="admin">Administrator (Full Operations & Catalog Management)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1.5">
                  {staffForm.role === "logistic" && "Can access Orders & Shipping, update status to packed/shipped, and approve/reject exchange requests."}
                  {staffForm.role === "customer_care" && "Can lookup orders by phone/name, view payment breakdown, and cancel orders when requested by riders."}
                  {staffForm.role === "admin" && "Has full management over products, categories, orders, shipping, and bulk migrations."}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingStaff}
                  className="px-5 py-2 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand/90 transition shadow-sm disabled:opacity-50"
                >
                  {creatingStaff ? "Creating..." : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DELETE USER CONFIRMATION */}
      {/* ========================================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Remove Account</h3>
            </div>
            
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">{userToDelete.name}</strong> ({userToDelete.email})?
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={deletingUser}
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition shadow-sm disabled:opacity-50"
              >
                {deletingUser ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
