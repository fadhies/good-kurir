import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, Tag } from "lucide-react";
import PhotoUpload from "@/components/PhotoUpload";
import { Image } from "@/components/ui/image";

const FIELDS = [
  { key: "food.hemat", label: "Makanan — Hemat" },
  { key: "food.cepat", label: "Makanan — Cepat" },
  { key: "goods", label: "Antar Barang" },
  { key: "person", label: "Antar Orang" },
];

function getDeep(obj, path) {
  return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
}
function setDeep(obj, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const ref = keys.reduce((o, k) => (o[k] = o[k] || {}), obj);
  ref[last] = value;
}

export default function AdminTariffs() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState(null);
  const [adminQris, setAdminQris] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [tRows, qRows] = await Promise.all([
        base44.entities.AppSetting.filter({ key: "tariffs" }, "-created_date", 1),
        base44.entities.AppSetting.filter({ key: "admin_qris" }, "-created_date", 1),
      ]);
      const base = {
        food: { hemat: { base: 7000, base_km: 4, per_km: 1000 }, cepat: { base: 12000, base_km: 4, per_km: 2000 } },
        goods: { base: 12000, base_km: 4, per_km: 2000 },
        person: { base: 12000, base_km: 4, per_km: 2000 },
        service_fee_percent: 10,
        driver_remit_per_txn: 1000,
      };
      const parsed = tRows[0]?.value ? JSON.parse(tRows[0].value) : {};
      setCfg({ ...base, ...parsed });
      setAdminQris(qRows[0]?.value || null);
    } catch (e) {
      setCfg(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function upsertSetting(key, value) {
    const rows = await base44.entities.AppSetting.filter({ key }, "-created_date", 1);
    if (rows[0]) await base44.entities.AppSetting.update(rows[0].id, { value });
    else await base44.entities.AppSetting.create({ key, value });
  }

  async function save() {
    setSaving(true);
    try {
      await upsertSetting("tariffs", JSON.stringify(cfg));
      await upsertSetting("admin_qris", adminQris || "");
      toast({ title: "Pengaturan tarif tersimpan" });
    } catch (e) {
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !cfg) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  const setField = (path, val) =>
    setCfg((prev) => {
      const n = { ...prev };
      setDeep(n, path, Number(val) || 0);
      return n;
    });

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-extrabold mb-1 flex items-center gap-2">
        <Tag className="w-6 h-6 text-primary" /> Pengaturan Tarif
      </h1>
      <p className="text-muted-foreground text-sm mb-6">Atur tarif antar per layanan, fee layanan, dan setoran driver.</p>

      <div className="space-y-4">
        {FIELDS.map((f) => {
          const t = getDeep(cfg, f.key);
          return (
            <div key={f.key} className="bg-card rounded-2xl border border-border p-4">
              <h3 className="font-bold text-sm mb-3">{f.label}</h3>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs">
                  Tarif Dasar (Rp)
                  <input
                    type="number"
                    value={t.base}
                    onChange={(e) => setField(`${f.key}.base`, e.target.value)}
                    className="w-full mt-1 px-2 py-2 rounded-lg border border-input bg-background text-sm"
                  />
                </label>
                <label className="text-xs">
                  Jarak Dasar (km)
                  <input
                    type="number"
                    value={t.base_km}
                    onChange={(e) => setField(`${f.key}.base_km`, e.target.value)}
                    className="w-full mt-1 px-2 py-2 rounded-lg border border-input bg-background text-sm"
                  />
                </label>
                <label className="text-xs">
                  Per km (Rp)
                  <input
                    type="number"
                    value={t.per_km}
                    onChange={(e) => setField(`${f.key}.per_km`, e.target.value)}
                    className="w-full mt-1 px-2 py-2 rounded-lg border border-input bg-background text-sm"
                  />
                </label>
              </div>
            </div>
          );
        })}

        <div className="bg-card rounded-2xl border border-border p-4 grid grid-cols-2 gap-3">
          <label className="text-xs">
            Fee Layanan (% dari ongkir)
            <input
              type="number"
              value={cfg.service_fee_percent}
              onChange={(e) => setField("service_fee_percent", e.target.value)}
              className="w-full mt-1 px-2 py-2 rounded-lg border border-input bg-background text-sm"
            />
          </label>
          <label className="text-xs">
            Setoran per Transaksi (Rp)
            <input
              type="number"
              value={cfg.driver_remit_per_txn}
              onChange={(e) => setField("driver_remit_per_txn", e.target.value)}
              className="w-full mt-1 px-2 py-2 rounded-lg border border-input bg-background text-sm"
            />
          </label>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="font-bold text-sm mb-2">QRIS Admin (untuk setoran driver)</h3>
          <PhotoUpload
            label="Gambar QRIS Admin"
            value={adminQris}
            onChange={setAdminQris}
            hint="Driver akan scan QRIS ini untuk menyetor fee harian."
          />
          {adminQris && (
            <div className="w-32 h-32 mt-2 rounded-lg overflow-hidden border border-border">
              <Image src={adminQris} fittingType="fit" className="w-full h-full" />
            </div>
          )}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Simpan Pengaturan
        </button>
      </div>
    </AdminLayout>
  );
}