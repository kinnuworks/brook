import { ChevronRight, LocateFixed, MapPin, Plus, Search } from "lucide-react";
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
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-ink-faint" aria-hidden />
          <span className="sr-only">{s.ui.searchSites}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={s.ui.searchSites}
            className="h-12 w-full rounded-full border-[1.5px] border-line bg-mist pl-11 pr-4 text-[16px] outline-none transition focus:border-aqua focus:bg-white"
          />
        </label>
        <button
          className="grid size-12 shrink-0 place-items-center rounded-full border-[1.5px] border-line bg-white text-deep transition hover:border-aqua hover:bg-aqua-50"
          onClick={locate}
          aria-label={s.ui.useMyLocation}
          title={s.ui.useMyLocation}
        >
          <LocateFixed className={`size-5 ${locating ? "animate-pulse" : ""}`} />
        </button>
      </div>
      {denied && <p className="text-[14px] text-clay-700">{s.ui.locationDenied}</p>}
      {!here && !query && (
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {CITIES.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={city === c.id}
              onClick={() => setCity(c.id)}
              className={`h-9 shrink-0 rounded-full border-[1.5px] px-3.5 text-[14px] font-semibold transition ${city === c.id ? "border-deep bg-deep text-white" : "border-line bg-white text-deep hover:border-aqua"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      {here && !query && <p className="eyebrow">{s.ui.nearest}</p>}
      {/* The list scrolls on its own and fades at the bottom, so a cut-off row reads as "more below". */}
      <ul className="fade-bottom grid max-h-[min(15rem,calc(46vh-9.5rem))] gap-1.5 overflow-y-auto overscroll-contain pb-5 sm:grid-cols-2 lg:max-h-[min(17rem,calc(42vh-9.5rem))]">
        {list.map((site) => (
          <li key={site.code}>
            <button
              className="flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-line bg-white px-3.5 py-2.5 text-left transition hover:border-aqua hover:bg-aqua-50"
              onClick={() => pick(site)}
            >
              <MapPin className="size-5 shrink-0 text-aqua-700" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-semibold leading-tight text-deep-900">{site.name}</span>
                <span className="mt-0.5 block truncate text-[13px] text-ink-soft">
                  {site.cityName} · {site.code}
                  {"distance" in site && typeof site.distance === "number" ? ` · ${formatDistance(site.distance)} ${s.ui.away}` : ""}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-ink-faint" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button className="mx-auto flex min-h-10 items-center gap-1.5 px-3 text-[14.5px] font-semibold text-deep hover:underline" onClick={() => setCustom(true)}>
        <Plus className="size-4.5" /> {s.ui.customSite}
      </button>
    </div>
  );
}
