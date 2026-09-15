"use client";
import React from "react";
import { AccountSidebar } from "@/modules/account/components/AccountSidebar";

export const AccountLayoutModule = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
      <AccountSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
};
