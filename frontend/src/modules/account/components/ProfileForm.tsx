"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, changePasswordSchema, ChangePasswordInput } from "@store4riders/shared-validation";
import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import Input from "@/components/ui/Input";
import PhoneInput from "@/components/ui/PhoneInput";
import Button from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { ShieldCheck, Mail, Edit2, Lock, CheckCircle2 } from "lucide-react";

export function ProfileForm() {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile details form
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    },
  });

  // Password change form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Reset form when user loads/changes
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      });
    }
  }, [user, reset]);

  // Fetch fresh profile from DB on mount
  useEffect(() => {
    let isMounted = true;
    apiClient
      .get("/users/me")
      .then((res) => {
        if (isMounted && res.data?.data) {
          setUser(res.data.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [setUser]);

  const onSubmit = async (data: z.infer<typeof updateProfileSchema>) => {
    setIsLoading(true);
    try {
      const res = await apiClient.put("/users/me", data);
      setUser(res.data.data);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    setIsChangingPassword(true);
    try {
      await apiClient.put("/users/me/password", data);
      toast.success("Password changed successfully!");
      resetPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ---------------- PROFILE DETAILS ---------------- */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-1">Profile Details</h1>
            <p className="text-zinc-500">Update your personal information and contact details.</p>
          </div>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)} className="hidden sm:flex gap-2">
              <Edit2 size={16} /> Edit Profile
            </Button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-visible">
          {/* Verification Banner */}
          <div className="bg-green-50 border-b border-green-100 px-6 py-4 flex items-start sm:items-center gap-3 rounded-t-2xl">
            <ShieldCheck className="text-green-600 mt-0.5 sm:mt-0 shrink-0" size={24} />
            <div>
              <h3 className="text-green-900 font-semibold text-sm">Account Verified</h3>
              <p className="text-green-700 text-xs mt-0.5">Your email address has been verified and is secure.</p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="relative">
                  <Input
                    label="First Name"
                    {...register("firstName")}
                    error={errors.firstName?.message as string}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Input
                    label="Last Name"
                    {...register("lastName")}
                    error={errors.lastName?.message as string}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="relative">
                  <div className="absolute top-[38px] left-3 text-zinc-400">
                    <Mail size={18} />
                  </div>
                  <Input
                    label="Email Address"
                    value={user?.email || ""}
                    disabled
                    className="pl-10 bg-zinc-50 text-zinc-500 font-medium"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1.5 ml-1">Email cannot be changed.</p>
                </div>
                <div className="relative">
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        label="Phone Number"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.phone?.message as string}
                        disabled={!isEditing}
                      />
                    )}
                  />
                </div>
              </div>

              {isEditing ? (
                <div className="pt-6 mt-2 border-t border-zinc-100 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={!isDirty && !isLoading}
                    className="w-full sm:w-auto px-8"
                  >
                    Save Changes
                  </Button>
                </div>
              ) : (
                <div className="pt-6 mt-2 border-t border-zinc-100 sm:hidden">
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Edit2 size={16} /> Edit Profile
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ---------------- CHANGE PASSWORD SECTION (Task 7.2 & 7.5) ---------------- */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-1 flex items-center gap-2">
            <Lock size={20} className="text-brand" /> Password & Security
          </h2>
          <p className="text-zinc-500 text-sm">
            Ensure your account is protected with a strong password.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden p-6 sm:p-8">
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="flex flex-col gap-5 max-w-xl">
            <div>
              <Input
                label="Current Password"
                type="password"
                placeholder="Enter current password"
                {...registerPassword("currentPassword")}
                error={passwordErrors.currentPassword?.message}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Min 8 characters"
                  {...registerPassword("newPassword")}
                  error={passwordErrors.newPassword?.message}
                />
              </div>
              <div>
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Re-enter new password"
                  {...registerPassword("confirmPassword")}
                  error={passwordErrors.confirmPassword?.message}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-start">
              <Button
                type="submit"
                isLoading={isChangingPassword}
                disabled={isChangingPassword}
                className="bg-zinc-900 hover:bg-black text-white px-6 py-2.5 font-bold text-xs uppercase tracking-wider"
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
