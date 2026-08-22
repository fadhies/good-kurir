// Google Maps API key (public client key — restrict by HTTP referrer in Google Cloud Console).
const GOOGLE_MAPS_API_KEY = "AIzaSyDkYH16ha2t5-G4J0PetpzWgifzrhJ0jA4";

let loader = null;

export function loadGoogleMaps() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    window.__gmapsInit = () => resolve(window.google.maps);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly&language=id&region=id&callback=__gmapsInit`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Gagal memuat Google Maps"));
    document.head.appendChild(s);
  });
  return loader;
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

export async function reverseGeocodePoi(lat, lng) {
  const gmaps = await loadGoogleMaps();
  const geocoder = new gmaps.Geocoder();
  return new Promise((resolve) => {
    geocoder.geocode({ location: { lat, lng } }, (res, status) => {
      if (status === "OK" && res?.[0]) {
        resolve({ name: extractPoiName(res[0].address_components), address: res[0].formatted_address });
      } else {
        resolve({ name: "", address: "" });
      }
    });
  });
}

export { GOOGLE_MAPS_API_KEY };