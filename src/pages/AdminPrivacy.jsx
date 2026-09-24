import React from "react";
import AdminLayout from "@/components/AdminLayout";
import PrivacyPolicyContent from "@/components/PrivacyPolicyContent";
import { Lock } from "lucide-react";

export default function AdminPrivacy() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lock className="w-6 h-6 text-primary" /> Kebijakan Privasi
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Halaman ini menginformasikan kepada pengguna bagaimana OjekTa mengelola data pribadi mereka.
        </p>
      </div>
      <PrivacyPolicyContent />
    </AdminLayout>
  );
}