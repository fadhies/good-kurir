import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Search, Loader2, MapPin } from "lucide-react";

const pinIcon = (accent) =>
  L.divIcon({
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:hsl(${accent});transform:rotate(-45deg);border:2px solid white;box-shadow:0 4px 10px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;"><div style="transform:rotate(45deg);width:8px;height:8px;background:white;border-radius:50%;"></div></div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });

const DEFAULT_CENTER = [-6.200000, 106.816666];

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ label, value, onChange, accent = "158 64% 30%" }) {
  const [query, setQuery] = useState(value?.address || "");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const center = value?.lat ? [value.lat, value.lng] : DEFAULT_CENTER;

  async function search(q) {
    if (!q || q.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&countrycodes=id&limit=5`,
        { headers: { "Accept-Language": "id" } }
      );
      const data = await res.json();
      setResults(data);
      setShowResults(true);
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "Accept-Language": "id" } }
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  async function pickFromResult(r) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setQuery(r.display_name);
    setShowResults(false);
    onChange({ lat, lng, address: r.display_name });
  }

  async function pickFromMap(lat, lng) {
    const address = await reverseGeocode(lat, lng);
    setQuery(address);
    onChange({ lat, lng, address });
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground/80">{label}</label>
      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              search(e.target.value);
            }}
            onFocus={() => results.length && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Cari toko, restoran, atau alamat..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        {showResults && results.length > 0 && (
          <div className="absolute z-[1000] mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
            {results.map((r, i) => (
              <button
                key={i}
                onMouseDown={() => pickFromResult(r)}
                className="flex items-start gap-2 w-full text-left px-3 py-2.5 hover:bg-accent/10 border-b border-border/50 last:border-0"
              >
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground/80 line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-xl overflow-hidden border border-border h-56">
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <ClickHandler onPick={pickFromMap} />
          {value?.lat && (
            <Marker position={[value.lat, value.lng]} icon={pinIcon(accent)} />
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        Klik peta untuk pin atau cari lewat kotak pencarian.
      </p>
    </div>
  );
}