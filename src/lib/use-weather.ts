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

async function fetchLatLon(signal: AbortSignal): Promise<{ lat: number; lon: number; city: string | null } | null> {
  try {
    const r = await fetch("https://ipapi.co/json/", { signal });
    if (!r.ok) return null;
    const j = await r.json();
    if (typeof j?.latitude === "number" && typeof j?.longitude === "number") {
      return { lat: j.latitude, lon: j.longitude, city: j.city ?? null };
    }
  } catch { /* ignore */ }
  return null;
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
        const loc = await fetchLatLon(ctrl.signal);
        if (!loc) return;
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
