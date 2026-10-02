import { LocateFixed, MapPin, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CITIES, formatDistance, nearestSites, searchSites, SITES, type OahSite } from "@/core/sites";
import type { SiteRef } from "@/core/protocol";
import { useStrings } from "@/i18n";

interface Props {
  onPick: (site: SiteRef) => void;
}

export function SiteStep({ onPick }: Props) {
  const s = useStrings();
  const [query, setQuery] = useState("");
  const [here, setHere] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);
  const [city, setCity] = useState<string>(CITIES[0].id);
  const [custom, setCustom] = useState(false);
  const [customName, setCustomName] = useState("");

  const locate = () => {
    if (!navigator.geolocation) return setDenied(true);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setHere({ lat: p.coords.latitude, lon: p.coords.longitude });
        setLocating(false);
        setDenied(false);
      },
      () => {
        setLocating(false);
        setDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  const list: (OahSite & { distance?: number })[] = useMemo(() => {
    if (query.trim()) return searchSites(query);
    if (here) return nearestSites(here.lat, here.lon, 6);
    return SITES.filter((x) => x.city === city).slice(0, 24);
  }, [query, here, city]);

  const pick = (site: OahSite) =>
    onPick({ code: site.code, name: site.name, lat: site.lat, lon: site.lon, city: site.cityName });

  if (custom) {
    return (
      <div className="space-y-3">
        <label className="block">
          <span className="text-[14px] font-semibold text-ink-soft">{s.ui.customSiteName}</span>
          <input
            autoFocus
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="mt-1 w-full rounded-2xl bg-white px-4 py-3.5 text-[17px] ring-[1.5px] ring-line outline-none focus:ring-aqua"
            placeholder="e.g. Ribeira de Coselhas, near the park"
          />
        </label>
        <button
          className="btn-primary w-full"
          disabled={customName.trim().length < 2 || locating}
          onClick={() => {
            const finish = (lat: number, lon: number) =>
              onPick({ code: `user-${crypto.randomUUID().slice(0, 8)}`, name: customName.trim(), lat, lon, custom: true });
            if (here) return finish(here.lat, here.lon);
            if (!navigator.geolocation) return finish(CITIES[0].lat, CITIES[0].lon);
            setLocating(true);
            navigator.geolocation.getCurrentPosition(
              (p) => finish(p.coords.latitude, p.coords.longitude),
              () => {
                setLocating(false);
                setDenied(true);
              },
              { enableHighAccuracy: true, timeout: 10_000 },
            );
          }}
        >
          <LocateFixed className="size-5" /> {locating ? s.ui.locating : s.ui.useThisPlace}
        </button>
        {denied && <p className="text-[14px] text-clay-700">{s.ui.locationDenied}</p>}
        <button className="btn-ghost w-full" onClick={() => setCustom(false)}>
          {s.ui.back}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-faint" aria-hidden />
          <span className="sr-only">{s.ui.searchSites}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={s.ui.searchSites}
            className="w-full rounded-2xl bg-white py-3.5 pl-10 pr-3 text-[16px] ring-[1.5px] ring-line outline-none focus:ring-aqua"
          />
        </label>
        <button className="btn-secondary !px-4" onClick={locate} aria-label={s.ui.useMyLocation} title={s.ui.useMyLocation}>
          <LocateFixed className={`size-5 ${locating ? "animate-pulse" : ""}`} />
        </button>
      </div>
      {denied && <p className="text-[14px] text-clay-700">{s.ui.locationDenied}</p>}
      {!here && !query && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist">
          {CITIES.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={city === c.id}
              onClick={() => setCity(c.id)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[14px] font-semibold ring-1 transition ${city === c.id ? "bg-deep text-white ring-deep" : "bg-white text-deep ring-line"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      {here && !query && <p className="eyebrow">{s.ui.nearest}</p>}
      <ul className="max-h-[38vh] space-y-2 overflow-y-auto pr-1">
        {list.map((site) => (
          <li key={site.code}>
            <button className="chip" onClick={() => pick(site)}>
              <MapPin className="size-5 shrink-0 text-aqua-700" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16.5px] font-semibold">{site.name}</span>
                <span className="block text-[13px] text-ink-soft">
                  {site.cityName} · {site.code}
                  {"distance" in site && typeof site.distance === "number" ? ` · ${formatDistance(site.distance)} ${s.ui.away}` : ""}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button className="btn-ghost w-full" onClick={() => setCustom(true)}>
        <Plus className="size-5" /> {s.ui.customSite}
      </button>
    </div>
  );
}
