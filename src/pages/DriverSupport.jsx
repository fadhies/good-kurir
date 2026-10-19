import React from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/lib/AuthContext";
import AdminDriverChat from "@/components/AdminDriverChat";

// Menu Bantuan driver: chat langsung dengan admin di luar pesanan.
export default function DriverSupport() {
  const { user } = useAuth();
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl mb-1 [font-family:'Cabin',_sans-serif] font-medium">Bantuan</h1>
        <p className="text-muted-foreground text-sm mb-5">
          Chat langsung dengan admin untuk koordinasi di luar pesanan.
        </p>
        <AdminDriverChat driverId={user?.id} viewerRole="driver" className="h-[70vh]" />
      </div>
    </Layout>
  );
}