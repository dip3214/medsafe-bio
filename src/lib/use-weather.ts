// Best-effort browser weather lookup. No API key.
//  - Prefers navigator.geolocation, falls back to IP geolocation.
//  - Current + short-range forecast via Open-Meteo.
// Fails silently: the hero background still renders without weather.

import { useCallback, useEffect, useRef, useState } from "react";

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
  willRainSoon: boolean;
  isCloudy: boolean;
  tempC: number | null;
  locationName: string | null;
  label: string;
};

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

async function fetchLatLonIp(signal: AbortSignal) {
  const providers = [
    { url: "https://ipapi.co/json/", pick: (j: any) => ({ lat: j?.latitude, lon: j?.longitude, city: j?.city ?? null }) },
    { url: "https://ipwho.is/",      pick: (j: any) => ({ lat: j?.latitude, lon: j?.longitude, city: j?.city ?? null }) },
  ];
  for (const p of providers) {
    try {
      const r = await fetch(p.url, { signal });
      if (!r.ok) continue;
      const j = await r.json();
      const { lat, lon, city } = p.pick(j);
      if (typeof lat === "number" && typeof lon === "number") return { lat, lon, city };
    } catch {}
  }
  return null;
}

function getBrowserLatLon(signal: AbortSignal, highAccuracy = true, forceFresh = false) {
  return new Promise<{ lat: number; lon: number; accuracy: number | null } | { error: string } | null>((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return resolve({ error: "Geolocation not supported by this browser" });
    }
    let done = false;
    const finish = (v: any) => { if (!done) { done = true; clearTimeout(timer); resolve(v); } };
    const timer = setTimeout(() => finish({ error: "Location request timed out" }), highAccuracy ? 12000 : 15000);
    signal.addEventListener("abort", () => finish(null));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy ?? null };
        try {
          localStorage.setItem("medsafe:geo",
            JSON.stringify({ ...coords, t: Date.now(), src: "browser" }));
        } catch {}
        finish(coords);
      },
      (err) => {
        const msg = err.code === 1 ? "Location permission denied — enable it in your browser settings"
                  : err.code === 2 ? "Location unavailable on this device"
                  : err.code === 3 ? "Location request timed out"
                  : "Couldn't get your location";
        finish({ error: msg });
      },
      { enableHighAccuracy: highAccuracy, maximumAge: forceFresh ? 0 : 5 * 60 * 1000, timeout: highAccuracy ? 11000 : 14000 },
    );
  });
}


function getCachedLatLon() {
  try {
    const raw = localStorage.getItem("medsafe:geo");
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (typeof j?.lat !== "number" || typeof j?.lon !== "number") return null;
    if (j.src !== "browser") return null;
    if (Date.now() - (j.t ?? 0) > 24 * 60 * 60 * 1000) return null;
    return { lat: j.lat, lon: j.lon } as { lat: number; lon: number };
  } catch { return null; }
}

async function reverseCity(lat: number, lon: number, signal: AbortSignal) {
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

async function renderFrom(
  loc: { lat: number; lon: number; city: string | null },
  signal: AbortSignal,
): Promise<Weather> {
  const data = await fetchWeather(loc.lat, loc.lon, signal);
  const code = data?.current?.weather_code ?? 0;
  const temp = data?.current?.temperature_2m ?? null;
  const condition = mapCode(code);
  const hourlyCodes: number[] = data?.hourly?.weather_code ?? [];
  const hourlyProb: number[]  = data?.hourly?.precipitation_probability ?? [];
  const willRainSoon =
    hourlyCodes.some((c) => { const m = mapCode(c); return m === "rain" || m === "thunder"; }) ||
    hourlyProb.some((p) => (p ?? 0) >= 60);
  const isRainingNow = condition === "rain" || condition === "thunder";
  const isCloudy = condition === "clouds" || condition === "fog" || willRainSoon;
  const parts = [conditionLabel(condition)];
  if (typeof temp === "number") parts.push(`${Math.round(temp)}°C`);
  if (loc.city) parts.push(loc.city);
  return {
    condition, isRainingNow, willRainSoon, isCloudy,
    tempC: typeof temp === "number" ? temp : null,
    locationName: loc.city,
    label: parts.join(" · "),
  };
}

export type GeoStatus =
  | "idle"
  | "locating"
  | "gps"
  | "cached"
  | "ip"
  | "denied"
  | "unavailable"
  | "timeout"
  | "unsupported"
  | "error";

export type UseWeatherResult = {
  weather: Weather | null;
  refresh: () => Promise<void>;
  refreshing: boolean;
  geoStatus: GeoStatus;
  geoMessage: string | null;
};

const STATUS_LABEL: Record<GeoStatus, string> = {
  idle: "Locating…",
  locating: "Locating…",
  gps: "GPS location",
  cached: "Recent GPS location",
  ip: "Approx. location (IP)",
  denied: "Location permission denied",
  unavailable: "Location unavailable",
  timeout: "Location request timed out",
  unsupported: "Geolocation not supported",
  error: "Couldn't get your location",
};

export function useWeather(): UseWeatherResult {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  const run = useCallback(async (forceFresh: boolean) => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setRefreshing(true);
    setGeoStatus("locating");
    setGeoMessage(STATUS_LABEL.locating);
    try {
      if (forceFresh) {
        try { localStorage.removeItem("medsafe:geo"); } catch {}
      }

      // 1) Always try a fresh browser GPS fix first.
      const tryBrowser = async () => {
        const a = await getBrowserLatLon(ctrl.signal, true, forceFresh);
        if (a && "lat" in a) return { fix: a, err: null as string | null };
        const b = await getBrowserLatLon(ctrl.signal, false, forceFresh);
        if (b && "lat" in b) return { fix: b, err: null as string | null };
        const err = (a && "error" in a && a.error) || (b && "error" in b && b.error) || null;
        return { fix: null, err };
      };
      const { fix, err: gpsErr } = await tryBrowser();

      let loc: { lat: number; lon: number; city: string | null } | null = null;
      let nextStatus: GeoStatus = "idle";

      if (fix) {
        const city = await reverseCity(fix.lat, fix.lon, ctrl.signal);
        loc = { lat: fix.lat, lon: fix.lon, city };
        nextStatus = "gps";
      } else {
        // 2) Fall back to a recent cached GPS fix if available.
        const cached = getCachedLatLon();
        if (cached) {
          const city = await reverseCity(cached.lat, cached.lon, ctrl.signal);
          loc = { ...cached, city };
          nextStatus = "cached";
        } else {
          // 3) Last resort — coarse IP lookup.
          const ip = await fetchLatLonIp(ctrl.signal);
          if (ip) {
            loc = ip;
            nextStatus = "ip";
          } else {
            nextStatus = gpsErr?.includes("denied") ? "denied"
              : gpsErr?.includes("timed out") ? "timeout"
              : gpsErr?.includes("unavailable") ? "unavailable"
              : gpsErr?.includes("not supported") ? "unsupported"
              : "error";
          }
        }
        if (gpsErr) console.warn("[weather] geolocation:", gpsErr);
      }

      setGeoStatus(nextStatus);
      setGeoMessage(gpsErr ?? STATUS_LABEL[nextStatus]);
      if (!loc) return;
      setWeather(await renderFrom(loc, ctrl.signal));
    } catch {} finally {
      if (ctrlRef.current === ctrl) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    run(false);
    return () => ctrlRef.current?.abort();
  }, [run]);

  const refresh = useCallback(() => run(true), [run]);

  return { weather, refresh, refreshing, geoStatus, geoMessage };
}
