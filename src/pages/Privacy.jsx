import React from "react";
import Layout from "@/components/Layout";
import PrivacyPolicyContent from "@/components/PrivacyPolicyContent";
import { Lock } from "lucide-react";

export default function Privacy() {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lock className="w-6 h-6 text-primary" /> Kebijakan Privasi
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bagaimana Good Kurir mengelola dan melindungi data pribadi Anda.
        </p>
      </div>
      <PrivacyPolicyContent />
    </Layout>
  );
}