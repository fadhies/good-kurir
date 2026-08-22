import React, { useState, useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { Search, Loader2, MapPin } from "lucide-react";

const DEFAULT_CENTER = { lat: -6.2, lng: 106.816666 };

function accentToHsl(accent) {
  return `hsl(${accent})`;
}

export default function GoogleLocationPicker({ label, value, onChange, accent = "158 64% 30%" }) {
  const [query, setQuery] = useState(value?.address || "");
  const [predictions, setPredictions] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [ready, setReady] = useState(false);

  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const acServiceRef = useRef(null);
  const placesRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    let active = true;
    loadGoogleMaps()
      .then((gmaps) => {
        if (!active || !mapElRef.current) return;
        const center =
          value?.lat != null && value?.lng != null
            ? { lat: value.lat, lng: value.lng }
            : DEFAULT_CENTER;
        mapRef.current = new gmaps.Map(mapElRef.current, {
          center,
          zoom: 14,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
        });
        geocoderRef.current = new gmaps.Geocoder();
        acServiceRef.current = new gmaps.places.AutocompleteService();
        placesRef.current = new gmaps.places.PlacesService(mapRef.current);

        const color = accentToHsl(accent);
        markerRef.current = new gmaps.Marker({
          map: mapRef.current,
          position: center,
          icon: {
            path: gmaps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
          visible: value?.lat != null,
        });

        mapRef.current.addListener("click", (e) => {
          pickFromMap(e.latLng.lat(), e.latLng.lng());
        });

        setReady(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !markerRef.current) return;
    if (value?.lat != null && value?.lng != null) {
      const pos = { lat: value.lat, lng: value.lng };
      mapRef.current.panTo(pos);
      markerRef.current.setPosition(pos);
      markerRef.current.setVisible(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng, ready]);

  useEffect(() => {
    if (value?.address) setQuery(value.address);
  }, [value?.address]);

  async function searchPredictions(q) {
    if (!q || q.length < 3) {
      setPredictions([]);
      return;
    }
    if (!acServiceRef.current) return;
    setSearching(true);
    try {
      const res = await acServiceRef.current.getPlacePredictions({
        input: q,
        componentRestrictions: { country: "id" },
      });
      setPredictions(res?.predictions || []);
      setShowResults(true);
    } catch {
      setPredictions([]);
    } finally {
      setSearching(false);
    }
  }

  function onQueryChange(e) {
    const v = e.target.value;
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPredictions(v), 300);
  }

  function pickPrediction(p) {
    setShowResults(false);
    setQuery(p.description);
    placesRef.current.getDetails(
      { placeId: p.place_id, fields: ["geometry", "formatted_address"] },
      (r, status) => {
        if (status === "OK" && r?.geometry?.location) {
          const loc = r.geometry.location;
          onChange({
            lat: loc.lat(),
            lng: loc.lng(),
            address: r.formatted_address || p.description,
          });
        } else {
          onChange({ address: p.description });
        }
      }
    );
  }

  function reverseGeocode(lat, lng) {
    return new Promise((resolve) => {
      geocoderRef.current.geocode({ location: { lat, lng } }, (res, status) => {
        if (status === "OK" && res?.[0]) resolve(res[0].formatted_address);
        else resolve(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      });
    });
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
            onChange={onQueryChange}
            onFocus={() => predictions.length && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Cari toko, restoran, atau alamat..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        {showResults && predictions.length > 0 && (
          <div className="absolute z-[1000] mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden max-h-64 overflow-y-auto">
            {predictions.map((p) => (
              <button
                key={p.place_id}
                onMouseDown={() => pickPrediction(p)}
                className="flex items-start gap-2 w-full text-left px-3 py-2.5 hover:bg-accent/10 border-b border-border/50 last:border-0"
              >
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground/80 line-clamp-2">{p.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-xl overflow-hidden border border-border h-56 bg-muted/30">
        {!ready && (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <div ref={mapElRef} style={{ height: "100%", width: "100%" }} />
      </div>
      <p className="text-xs text-muted-foreground">
        Klik peta untuk pin atau cari lewat kotak pencarian.
      </p>
    </div>
  );
}