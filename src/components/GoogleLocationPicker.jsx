import React, { useState, useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { Search, Loader2, MapPin } from "lucide-react";

const DEFAULT_CENTER = { lat: -6.2, lng: 106.816666 };

export default function GoogleLocationPicker({ label, value, onChange, biasCenter }) {
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
  const sessionTokenRef = useRef(null);
  const debounceRef = useRef(null);
  const userCenterRef = useRef(null);

  useEffect(() => {
    let active = true;
    loadGoogleMaps()
      .then((gmaps) => {
        if (!active || !mapElRef.current) return;
        const center =
          value?.lat != null && value?.lng != null
            ? { lat: value.lat, lng: value.lng }
            : biasCenter?.lat != null && biasCenter?.lng != null
            ? { lat: biasCenter.lat, lng: biasCenter.lng }
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
        sessionTokenRef.current = new gmaps.places.AutocompleteSessionToken();

        const pinSvg =
          '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="48" viewBox="0 0 28 48">' +
          '<path d="M11 20 L17 20 L14 46 Z" fill="#F5F5F5" stroke="#333333" stroke-width="1.5" stroke-linejoin="round"/>' +
          '<circle cx="14" cy="13" r="11" fill="#FF4500" stroke="#333333" stroke-width="1.5"/>' +
          "</svg>";
        const pinUrl = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(pinSvg);
        markerRef.current = new gmaps.Marker({
          map: mapRef.current,
          position: center,
          icon: {
            url: pinUrl,
            scaledSize: new gmaps.Size(28, 48),
            anchor: new gmaps.Point(14, 46),
          },
          visible: value?.lat != null,
        });

        mapRef.current.addListener("click", (e) => {
          pickFromMap(e.latLng.lat(), e.latLng.lng());
        });

        setReady(true);

        // Default ke lokasi pengguna bila tidak ada value/biasCenter (mis. halaman Daftar Driver)
        if (value?.lat == null && !(biasCenter?.lat != null) && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!active || !mapRef.current) return;
              const uLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              userCenterRef.current = uLoc;
              mapRef.current.panTo(uLoc);
            },
            () => {},
            { enableHighAccuracy: true, timeout: 10000 }
          );
        }
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

  // Re-center ke lokasi pengguna (biasCenter) begitu GPS tersedia, bila belum ada pin value
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (value?.lat != null) return;
    if (biasCenter?.lat != null && biasCenter?.lng != null) {
      mapRef.current.panTo({ lat: biasCenter.lat, lng: biasCenter.lng });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biasCenter?.lat, biasCenter?.lng, ready, value?.lat]);

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
      const req = { input: q, componentRestrictions: { country: "id" } };
      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      }
      req.sessionToken = sessionTokenRef.current;
      const bias = biasCenter?.lat != null ? biasCenter : userCenterRef.current;
      if (bias?.lat != null) {
        req.location = new window.google.maps.LatLng(bias.lat, bias.lng);
        req.radius = 5000;
      }
      const res = await acServiceRef.current.getPlacePredictions(req);
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
    const fallbackName = p.structured_formatting?.main_text || "";
    setQuery(fallbackName || p.description);
    const usedToken = sessionTokenRef.current;
    placesRef.current.getDetails(
      { placeId: p.place_id, fields: ["geometry", "formatted_address", "name"], sessionToken: usedToken },
      (r, status) => {
        // Tutup sesi ini & siapkan token baru untuk pencarian berikutnya
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        if (status === "OK" && r?.geometry?.location) {
          const loc = r.geometry.location;
          const name = r.name || fallbackName;
          if (name) setQuery(name);
          onChange({
            lat: loc.lat(),
            lng: loc.lng(),
            address: r.formatted_address || p.description,
            name,
          });
        } else {
          onChange({ address: p.description, name: fallbackName });
        }
      }
    );
  }

  function extractPoiName(components) {
    if (!components) return "";
    const poiTypes = ["point_of_interest", "establishment", "premise", "subpremise", "neighborhood"];
    for (const t of poiTypes) {
      const c = components.find((c) => c.types.includes(t));
      if (c?.long_name) return c.long_name;
    }
    return "";
  }

  function reverseGeocode(lat, lng) {
    return new Promise((resolve) => {
      geocoderRef.current.geocode({ location: { lat, lng } }, (res, status) => {
        if (status === "OK" && res?.[0]) {
          resolve({
            address: res[0].formatted_address,
            name: extractPoiName(res[0].address_components),
          });
        } else {
          resolve({ address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, name: "" });
        }
      });
    });
  }

  async function pickFromMap(lat, lng) {
    const { address, name } = await reverseGeocode(lat, lng);
    setQuery(name || address);
    onChange({ lat, lng, address, name });
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
            onBlur={() => setShowResults(false)}
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
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickPrediction(p)}
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