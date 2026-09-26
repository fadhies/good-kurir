import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import GoogleLocationPicker from "@/components/GoogleLocationPicker";
import { Home as HouseIcon, Briefcase, Plus, MapPin } from "lucide-react";
import { loadFavorites, saveFavorites } from "@/lib/favoritePlaces";

// Chip alamat tujuan favorit (layanan antar orang):
// - "Rumah"/"Kantor": tap pertama = simpan alamat; setelah tersimpan, tap = buka pesanan dengan tujuan terisi.
// - "Tambah Lokasi": simpan lokasi favorit lain (mis. sekolah anak).
const BUILT_INS = [
  { id: "rumah", label: "Rumah", icon: HouseIcon },
  { id: "kantor", label: "Kantor", icon: Briefcase }
];

export default function FavoritePlacesChips({ userId }) {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState(() => loadFavorites(userId));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(false);
  const [editing, setEditing] = useState(null); // built-in {id,label} saat edit
  const [customLabel, setCustomLabel] = useState("");
  const [picked, setPicked] = useState(null);

  const savedById = Object.fromEntries(favorites.map((f) => [f.id, f]));
  const customs = favorites.filter((f) => !BUILT_INS.some((b) => b.id === f.id));

  function persist(list) {
    setFavorites(list);
    saveFavorites(userId, list);
  }

  function openDialog(builtIn, add) {
    setIsAdd(add);
    setEditing(builtIn);
    setPicked(add ? null : savedById[builtIn.id] || null);
    setCustomLabel("");
    setDialogOpen(true);
  }

  function chipClick(place) {
    const saved = savedById[place.id];
    if (saved) {
      navigate(
        `/pesan?type=person&dest_lat=${saved.lat}&dest_lng=${saved.lng}&dest_addr=${encodeURIComponent(saved.address)}`
      );
    } else {
      openDialog(place, false);
    }
  }

  function handleSave() {
    if (!picked?.lat || !picked?.lng) return;
    if (isAdd) {
      const label = customLabel.trim();
      if (!label) return;
      persist([
        ...favorites,
        { id: `c_${Date.now()}`, label, address: picked.address, lat: picked.lat, lng: picked.lng }
      ]);
    } else {
      persist([
        ...favorites.filter((f) => f.id !== editing.id),
        { id: editing.id, label: editing.label, address: picked.address, lat: picked.lat, lng: picked.lng }
      ]);
    }
    setDialogOpen(false);
  }

  const chipCls =
    "rounded-[22px] px-[13px] py-2.5 bg-white/90 backdrop-blur text-[#174539] flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap";

  return (
    <>
      <div className="flex gap-2">
        {BUILT_INS.map((b) => {
          const Icon = b.icon;
          const saved = !!savedById[b.id];
          return (
            <button key={b.id} onClick={() => chipClick(b)} className={chipCls}>
              <Icon className={`w-4 h-4 ${saved ? "text-[#079447]" : "text-[#087c61]"}`} />
              {b.label}
              {saved && <span className="text-[#079447] font-bold">✓</span>}
            </button>
          );
        })}
        {customs.map((c) => (
          <div key={c.id} role="button" tabIndex={0} onClick={() => chipClick(c)} className={`${chipCls} cursor-pointer`}>
            <MapPin className="w-4 h-4 text-[#079447] shrink-0" />
            <span className="truncate max-w-[110px]">{c.label}</span>
            <span
              role="button"
              aria-label={`Hapus ${c.label}`}
              onClick={(e) => {
                e.stopPropagation();
                persist(favorites.filter((f) => f.id !== c.id));
              }}
              className="text-[#98a2b3] hover:text-[#d92d20] font-bold leading-none"
            >
              ×
            </span>
          </div>
        ))}
        <button onClick={() => openDialog(BUILT_INS[0], true)} className={chipCls}>
          <Plus className="w-4 h-4 text-[#087c61]" />
          Tambah Lokasi
        </button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100%-24px)] max-w-[350px] rounded-3xl p-4 gap-3 max-h-[88dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAdd ? "Tambah Lokasi Favorit" : `Alamat ${editing?.label}`}</DialogTitle>
            <DialogDescription>
              Simpan alamat tujuan favorit untuk layanan antar orang — setelah tersimpan, tap chip untuk langsung memesan.
            </DialogDescription>
          </DialogHeader>
          {isAdd && (
            <input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Nama lokasi (mis: Sekolah Anak)"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500"
            />
          )}
          <GoogleLocationPicker label="Pilih alamat tujuan" value={picked} onChange={setPicked} />
          <div className="flex gap-2">
            {!isAdd && savedById[editing?.id] && (
              <button
                onClick={() => {
                  persist(favorites.filter((f) => f.id !== editing.id));
                  setDialogOpen(false);
                }}
                className="flex-1 rounded-2xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold py-3"
              >
                Hapus
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!picked?.lat || (isAdd && !customLabel.trim())}
              className="flex-1 rounded-2xl bg-emerald-600 text-white text-xs font-bold py-3 disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}