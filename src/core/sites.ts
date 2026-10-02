// OneAquaHealth's 106 urban-stream research sites, with what the lab last
// measured at each one. Snapshot of api.enora-oah.eu, refreshed with
// `npm run data`; bundled so the check works with no signal at the stream.

import snapshot from "../data/oah/sites-compact.json";

export interface LabValue {
  value: string | number;
  date: string;
  richness?: number | null;
}

export interface OahSite {
  code: string;
  name: string;
  city: string;
  cityName: string;
  lat: number;
  lon: number;
  alt: number | null;
  lab: {
    macroinvertebrates: LabValue | null;
    diatoms: LabValue | null;
    fish: LabValue | null;
    nitrate: LabValue | null;
  };
  risk: { date: string | null; pathogen: number | null; fecal: number | null; arg: number | null; health: number | null } | null;
  urban: {
    impervious100m: number | null;
    impervious500m: number | null;
    vegCover100m: number | null;
    urban500m: number | null;
    distSewageM: number | null;
    distHospitalM: number | null;
  } | null;
}

export const SITES = snapshot.sites as OahSite[];
export const SITES_FETCHED_AT = snapshot.fetchedAt;
export const SITE_BY_CODE = new Map(SITES.map((s) => [s.code, s]));

export const CITIES = [
  { id: "CO", name: "Coimbra", country: "Portugal", lat: 40.2033, lon: -8.4103, lang: "pt" },
  { id: "TO", name: "Toulouse", country: "France", lat: 43.6047, lon: 1.4442, lang: "fr" },
  { id: "GH", name: "Ghent", country: "Belgium", lat: 51.0543, lon: 3.7174, lang: "nl" },
  { id: "BE", name: "Benevento", country: "Italy", lat: 41.1291, lon: 14.7868, lang: "it" },
  { id: "OS", name: "Oslo", country: "Norway", lat: 59.9139, lon: 10.7522, lang: "no" },
] as const;

/** Great-circle distance in metres. */
export function distanceM(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearestSites(lat: number, lon: number, n = 5): (OahSite & { distance: number })[] {
  return SITES.map((s) => ({ ...s, distance: distanceM(lat, lon, s.lat, s.lon) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, n);
}

export function searchSites(query: string): OahSite[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SITES.filter(
    (s) => s.name.toLowerCase().includes(q) || s.cityName.toLowerCase().includes(q) || s.code.toLowerCase() === q,
  ).slice(0, 12);
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  if (m < 100_000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m / 1000)} km`;
}
