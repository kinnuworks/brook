// Recent weather at the stream, from Open-Meteo (free, no key, CORS-enabled).
// Used for Brook's "second look" (clear water right after heavy rain is
// unusual) and for the story card. Never blocks the check: on any failure
// the check simply carries on without weather.

export interface RecentWeather {
  rain48hMm: number;
  rain72hMm: number;
  maxTempC: number | null;
  hotDays: number;
  source: "open-meteo";
  fetchedAt: string;
}

export async function fetchRecentWeather(lat: number, lon: number, signal?: AbortSignal): Promise<RecentWeather | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&hourly=precipitation&daily=temperature_2m_max&past_days=3&forecast_days=1&timezone=auto`;
  try {
    const res = await fetch(url, { signal: signal ?? AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    const times: string[] = data.hourly?.time ?? [];
    const rain: number[] = data.hourly?.precipitation ?? [];
    const now = Date.now();
    let r48 = 0;
    let r72 = 0;
    times.forEach((t, i) => {
      const age = now - new Date(t).getTime();
      if (age < 0) return;
      if (age <= 48 * 3600e3) r48 += rain[i] ?? 0;
      if (age <= 72 * 3600e3) r72 += rain[i] ?? 0;
    });
    const maxes: number[] = (data.daily?.temperature_2m_max ?? []).filter((v: unknown) => typeof v === "number");
    return {
      rain48hMm: Math.round(r48 * 10) / 10,
      rain72hMm: Math.round(r72 * 10) / 10,
      maxTempC: maxes.length ? Math.max(...maxes) : null,
      hotDays: maxes.filter((v) => v >= 30).length,
      source: "open-meteo",
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
