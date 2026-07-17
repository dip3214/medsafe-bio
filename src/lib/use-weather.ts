// Best-effort browser weather lookup. No API key.
//  - IP-based geolocation via ipapi.co (no permission prompt)
//  - Current + next-hours forecast via Open-Meteo
// Fails silently: the hero background still renders without weather.

import { useEffect, useState } from "react";

export type WeatherCondition =
  | "clear"
  | "clouds"
  | "rain"
  | "snow"
  | "thunder"
  | "fog";

export type Weather = {
  condition: WeatherCondition;
  isRainingNow: boolean;
  willRainSoon: boolean; // any rain in the next ~6h
  isCloudy: boolean;
  tempC: number | null;
  locationName: string | null;
  label: string; // short human string e.g. "Light rain · 24°C"
};

// Open-Meteo WMO weather codes → condition
function mapCode(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code <= 3) return "clouds";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunder";
  return "clouds";
}

function conditionLabel(c: WeatherCondition): string {
  switch (c) {
    case "clear":   return "Clear";
    case "clouds":  return "Cloudy";
    case "rain":    return "Rain";
    case "snow":    return "Snow";
    case "thunder": return "Thunderstorm";
    case "fog":     return "Fog";
  }
}

async function fetchLatLonIp(signal: AbortSignal): Promise<{ lat: number; lon: number; city: string | null } | null> {
  const providers = [
    { url: "https://ipapi.co/json/", pick: (j: any) => ({ lat: j?.latitude, lon: j?.longitude, city: j?.city ?? null }) },
    { url: "https://ipwho.is/", pick: (j: any) => ({ lat: j?.latitude, lon: j?.longitude, city: j?.city ?? null }) },
  ];
  for (const p of providers) {
    try {
      const r = await fetch(p.url, { signal });
      if (!r.ok) continue;
      const j = await r.json();
      const { lat, lon, city } = p.pick(j);
      if (typeof lat === "number" && typeof lon === "number") return { lat, lon, city };
    } catch { /* try next */ }
  }
  return null;
}

function getBrowserLatLon(signal: AbortSignal, highAccuracy = true): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    let done = false;
    const finish = (v: { lat: number; lon: number } | null) => { if (!done) { done = true; clearTimeout(timer); resolve(v); } };
    const timer = setTimeout(() => finish(null), highAccuracy ? 6000 : 10000);
    signal.addEventListener("abort", () => finish(null));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        try { localStorage.setItem("medsafe:geo", JSON.stringify({ ...coords, t: Date.now() })); } catch {}
        finish(coords);
      },
      () => finish(null),
      { enableHighAccuracy: highAccuracy, maximumAge: 10 * 60 * 1000, timeout: highAccuracy ? 5500 : 9000 },
    );
  });
}

function getCachedLatLon(): { lat: number; lon: number } | null {
  try {
    const raw = localStorage.getItem("medsafe:geo");
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (typeof j?.lat !== "number" || typeof j?.lon !== "number") return null;
    // 24h freshness
    if (Date.now() - (j.t ?? 0) > 24 * 60 * 60 * 1000) return null;
    return { lat: j.lat, lon: j.lon };
  } catch { return null; }
}

async function reverseCity(lat: number, lon: number, signal: AbortSignal): Promise<string | null> {
  try {
    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`,
      { signal },
    );
    if (!r.ok) return null;
    const j = await r.json();
    const first = j?.results?.[0];
    return first?.name ?? first?.admin1 ?? null;
  } catch { return null; }
}

async function fetchWeather(lat: number, lon: number, signal: AbortSignal) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&hourly=weather_code,precipitation_probability&forecast_hours=6&timezone=auto`;
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error("weather fetch failed");
  return r.json();
}

export function useWeather(): Weather | null {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        // Prefer live browser geolocation (highest accuracy). Cached fix keeps
        // the UI responsive while a fresh fix loads; IP is only a last resort.
        let loc: { lat: number; lon: number; city: string | null } | null = null;
        const cached = getCachedLatLon();
        if (cached) {
          const city = await reverseCity(cached.lat, cached.lon, ctrl.signal);
          loc = { ...cached, city };
          renderFrom(loc, ctrl.signal, setWeather);
        }
        const fresh =
          (await getBrowserLatLon(ctrl.signal, true)) ??
          (await getBrowserLatLon(ctrl.signal, false));
        if (fresh) {
          const city = await reverseCity(fresh.lat, fresh.lon, ctrl.signal);
          loc = { ...fresh, city };
        } else if (!loc) {
          loc = await fetchLatLonIp(ctrl.signal);
        }
        if (!loc) return;
        await renderFrom(loc, ctrl.signal, setWeather);
        const data = await fetchWeather(loc.lat, loc.lon, ctrl.signal);
        const code = data?.current?.weather_code ?? 0;
        const temp = data?.current?.temperature_2m ?? null;
        const condition = mapCode(code);

        const hourlyCodes: number[] = data?.hourly?.weather_code ?? [];
        const hourlyProb: number[] = data?.hourly?.precipitation_probability ?? [];
        const willRainSoon =
          hourlyCodes.some((c) => {
            const m = mapCode(c);
            return m === "rain" || m === "thunder";
          }) || hourlyProb.some((p) => (p ?? 0) >= 60);

        const isRainingNow = condition === "rain" || condition === "thunder";
        const isCloudy = condition === "clouds" || condition === "fog" || willRainSoon;

        const parts = [conditionLabel(condition)];
        if (typeof temp === "number") parts.push(`${Math.round(temp)}°C`);
        if (loc.city) parts.push(loc.city);

        setWeather({
          condition,
          isRainingNow,
          willRainSoon,
          isCloudy,
          tempC: typeof temp === "number" ? temp : null,
          locationName: loc.city,
          label: parts.join(" · "),
        });
      } catch { /* fail silently */ }
    })();
    return () => ctrl.abort();
  }, []);

  return weather;
}
