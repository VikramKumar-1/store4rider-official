"use client";
import { useState } from "react";
import { useAdminUsers, useUpdateUserRole, useUpdateUserStatus } from "@/core/hooks/useAdminUsers";
import { toast } from "sonner";

const USER_ROLES = [
  "super_admin",
  "admin",
  "product_manager",
  "order_manager",
  "marketing_manager",
  "customer_support",
  "customer"
];

export function AdminUsers() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const limit = 20;

  const { data, isLoading } = useAdminUsers(page, limit, roleFilter);
  const { mutate: updateRole, isPending: updatingRole } = useUpdateUserRole();
  const { mutate: updateStatus, isPending: updatingStatus } = useUpdateUserStatus();

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRole({ userId, role: newRole }, {
      onSuccess: () => toast.success("Role updated successfully"),
      onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to update role")
    });
  };

  const handleStatusToggle = (userId: string, isActive: boolean) => {
    updateStatus({ userId, isActive }, {
      onSuccess: () => toast.success("Status updated successfully"),
      onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to update status")
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Filter Role:</label>
          <select 
            value={roleFilter} 
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="border-gray-300 rounded-md text-sm focus:ring-brand focus:border-brand px-3 py-2 border outline-none"
          >
            <option value="">All Roles</option>
            {USER_ROLES.map(role => (
              <option key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : data?.items?.map((user: any) => (
                <tr key={user._id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      disabled={updatingRole}
                      className="text-xs border-gray-200 rounded p-1 outline-none"
                    >
                      {USER_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleStatusToggle(user._id, !user.isActive)}
                      disabled={updatingStatus}
                      className={`text-xs font-medium px-3 py-1 rounded border ${user.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                    >
                      {user.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
              {data?.items?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination controls */}
        {data?.totalCount > limit && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.totalCount)} of {data.totalCount} results
            </span>
            <div className="space-x-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= data.totalCount}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
