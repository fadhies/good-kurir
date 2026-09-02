import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import S from "@/lib/supabaseEntities";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, Tag, Smartphone } from "lucide-react";

const FIELDS = [
{ key: "food.hemat", label: "Makanan — Hemat" },
{ key: "food.cepat", label: "Makanan — Cepat" },
{ key: "goods", label: "Antar Barang" },
{ key: "person", label: "Antar Orang" }];


function getDeep(obj, path) {
  return path.split(".").reduce((o, k) => o ? o[k] : undefined, obj);
}
function setDeep(obj, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const ref = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
  ref[last] = value;
}

export default function AdminTariffs() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState(null);
  const [adminDana, setAdminDana] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [tRows, dRows] = await Promise.all([
      S.AppSetting.filter({ key: "tariffs" }, "-created_date", 1),
      S.AppSetting.filter({ key: "admin_dana_number" }, "-created_date", 1)]
      );
      const base = {
        food: { hemat: { base: 7000, base_km: 4, per_km: 1000 }, cepat: { base: 12000, base_km: 4, per_km: 2000 } },
        goods: { base: 12000, base_km: 4, per_km: 2000 },
        person: { base: 12000, base_km: 4, per_km: 2000 },
        service_fee_percent: 10,
        driver_remit_per_txn: 1000
      };
      const parsed = tRows[0]?.value ? JSON.parse(tRows[0].value) : {};
      setCfg({ ...base, ...parsed });
      setAdminDana(dRows[0]?.value || "");
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
    const rows = await S.AppSetting.filter({ key }, "-created_date", 1);
    if (rows[0]) await S.AppSetting.update(rows[0].id, { value });else
    await S.AppSetting.create({ key, value });
  }

  async function save() {
    setSaving(true);
    try {
      await upsertSetting("tariffs", JSON.stringify(cfg));
      await upsertSetting("admin_dana_number", adminDana || "");
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
      </AdminLayout>);

  }

  const setField = (path, val) =>
  setCfg((prev) => {
    const n = { ...prev };
    setDeep(n, path, Number(val) || 0);
    return n;
  });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-extrabold mb-1 flex items-center gap-2 [font-family:'Cabin',_sans-serif]">
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
                    className="w-full mt-1 px-2 py-2 rounded-lg border border-input bg-background text-sm" />
                  
                </label>
                <label className="text-xs">
                  Jarak Dasar (km)
                  <input
                    type="number"
                    value={t.base_km}
                    onChange={(e) => setField(`${f.key}.base_km`, e.target.value)}
                    className="w-full mt-1 px-2 py-2 rounded-lg border border-input bg-background text-sm" />
                  
                </label>
                <label className="text-xs">
                  Per km (Rp)
                  <input
                    type="number"
                    value={t.per_km}
                    onChange={(e) => setField(`${f.key}.per_km`, e.target.value)}
                    className="w-full mt-1 px-2 py-2 rounded-lg border border-input bg-background text-sm" />
                  
                </label>
              </div>
            </div>);

        })}

        <div className="bg-card rounded-2xl border border-border p-4 grid grid-cols-2 gap-3">
          <label className="text-xs">
            Fee Layanan (% dari ongkir)
            <input
              type="number"
              value={cfg.service_fee_percent}
              onChange={(e) => setField("service_fee_percent", e.target.value)}
              className="w-full mt-1 px-2 py-2 rounded-lg border border-input bg-background text-sm" />
            
          </label>
          <label className="text-xs">
            Setoran per Transaksi (Rp)
            <input
              type="number"
              value={cfg.driver_remit_per_txn}
              onChange={(e) => setField("driver_remit_per_txn", e.target.value)}
              className="w-full mt-1 px-2 py-2 rounded-lg border border-input bg-background text-sm" />
            
          </label>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-primary" /> Nomor DANA Admin (untuk setoran driver)
          </h3>
          <input
            type="tel"
            inputMode="tel"
            value={adminDana}
            onChange={(e) => setAdminDana(e.target.value)}
            placeholder="08xxxxxxxxxx"
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
          
          <p className="text-xs text-muted-foreground mt-1.5">Driver akan transfer setoran fee harian ke nomor DANA ini.</p>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
          
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Simpan Pengaturan
        </button>
      </div>
    </AdminLayout>);

}