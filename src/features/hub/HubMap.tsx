import "maplibre-gl/dist/maplibre-gl.css";
import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { useMemo, useState } from "react";
import Map, { Marker, NavigationControl, Popup, type MapRef } from "react-map-gl/maplibre";
import { Link } from "react-router";
import { CITIES, SITES, SITE_BY_CODE } from "@/core/sites";
import { labHeadline } from "@/core/onehealth";
import { useStrings } from "@/i18n";
import type { HubRow } from "./analytics";

// MapLibre 6 finds its worker relative to its own file, which bundlers move; point it at Vite's copy.
maplibregl.setWorkerUrl(workerUrl);

const RATING_COLOR: Record<string, string> = { GOOD: "#8cc740", MODERATE: "#f2b33d", POOR: "#c9603d" };

export function HubMap({ rows }: { rows: HubRow[] }) {
  const s = useStrings();
  const [map, setMap] = useState<MapRef | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const bySite = useMemo(() => {
    const m = new globalThis.Map<string, HubRow[]>();
    for (const r of rows) m.set(r.site_code, [...(m.get(r.site_code) ?? []), r]);
    return m;
  }, [rows]);

  const sel = selected ? SITE_BY_CODE.get(selected) : null;
  const selRows = selected ? bySite.get(selected) ?? [] : [];
  const latest = selRows[0];
  const lab = labHeadline(sel);

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] ring-1 ring-line">
      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
        {CITIES.map((c) => (
          <button
            key={c.id}
            className="rounded-full bg-white/95 px-3 py-1.5 text-[13px] font-semibold text-deep shadow ring-1 ring-line hover:ring-aqua"
            onClick={() => map?.flyTo({ center: [c.lon, c.lat], zoom: 11, duration: 1400 })}
          >
            {c.name}
          </button>
        ))}
      </div>
      <Map
        ref={setMap}
        mapLib={maplibregl}
        initialViewState={{ bounds: [-10.5, 38.6, 16.5, 61.2], fitBoundsOptions: { padding: 30 } }}
        style={{ width: "100%", height: 460 }}
        mapStyle="https://tiles.openfreemap.org/styles/positron"
        attributionControl={{ compact: true }}
        cooperativeGestures
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        {SITES.map((site) => {
          const list = bySite.get(site.code);
          const rating = list?.[0]?.dto?.overallAssessment;
          const color = rating ? RATING_COLOR[rating] : "#9fb3bf";
          const size = list ? Math.min(26, 12 + list.length * 3) : 9;
          return (
            <Marker key={site.code} longitude={site.lon} latitude={site.lat} anchor="center" onClick={(e) => (e.originalEvent.stopPropagation(), setSelected(site.code))}>
              <button
                aria-label={`${site.name}, ${site.cityName}`}
                className="grid place-items-center rounded-full border-2 border-white shadow-md transition hover:scale-125"
                style={{ width: size, height: size, background: color }}
              >
                {list && list.length > 1 && <span className="text-[9px] font-bold text-white">{list.length}</span>}
              </button>
            </Marker>
          );
        })}
        {rows
          .filter((r) => r.custom_site)
          .map((r) => (
            <Marker key={r.id} longitude={r.lon} latitude={r.lat} anchor="center">
              <span className="block size-3 rounded-full border-2 border-white bg-sky shadow" />
            </Marker>
          ))}
        {sel && (
          <Popup longitude={sel.lon} latitude={sel.lat} anchor="bottom" offset={14} onClose={() => setSelected(null)} closeOnClick={false} maxWidth="280px">
            <div className="font-sans text-ink">
              <div className="text-[15px] font-bold text-deep-900">{sel.name}</div>
              <div className="text-[12px] text-ink-soft">
                {sel.cityName} · {sel.code}
              </div>
              <div className="mt-2 grid gap-1 text-[12.5px]">
                <div>
                  <span className="text-ink-soft">{s.hub.labLatest}: </span>
                  <b>{lab ? `${s.story.indicators[lab.key]} · ${s.story.quality[String(lab.value)] ?? lab.value} (${lab.date.slice(0, 4)})` : "—"}</b>
                </div>
                <div>
                  <span className="text-ink-soft">{s.hub.latestCitizen}: </span>
                  <b>{latest ? `${s.q.overallAssessment.options?.[latest.dto.overallAssessment]?.label} · ${new Date(latest.created_at).toLocaleDateString()}` : s.hub.noChecks}</b>
                </div>
                <div className="text-ink-soft">
                  {selRows.length} {s.hub.checks.toLowerCase()}
                </div>
              </div>
              {latest && (
                <Link to={`/story/${latest.id}`} className="mt-2 inline-block text-[13px] font-semibold text-deep underline">
                  {s.hub.open} →
                </Link>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
