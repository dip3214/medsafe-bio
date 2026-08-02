import { useEffect, useMemo, useRef, useState } from "react";
import { BellRing, BellOff, Plus, X } from "lucide-react";

// Gentle on-device reminders ("alarms") that nudge the user to log their day.
// Uses the browser Notification API — works on desktop and on Android/installed
// PWAs while MedSafe is open or running in the background. Times are stored
// locally on the device so nothing personal leaves the phone.

type Reminder = { id: string; time: string; label: string };

const STORAGE_KEY = "medsafe:log-reminders:v1";
const FIRED_KEY = "medsafe:log-reminders:fired";

const DEFAULTS: Reminder[] = [
  { id: "lunch", time: "13:30", label: "Had lunch? Log your meal 🍛" },
  { id: "evening", time: "20:30", label: "Close the day — dinner, mood & sleep 🌙" },
];

const PRESETS: { time: string; label: string }[] = [
  { time: "07:30", label: "Breakfast — log your first meal 🥣" },
  { time: "09:00", label: "Medicines — take your morning dose 💊" },
  { time: "13:30", label: "Lunch — log your meal 🍛" },
  { time: "17:30", label: "Movement — walk or workout 🏃" },
  { time: "20:30", label: "Dinner — log your evening meal 🍽️" },
  { time: "22:30", label: "Bedtime — log mood & sleep 🌙" },
];


function load(): { enabled: boolean; items: Reminder[] } {
  if (typeof window === "undefined") return { enabled: false, items: DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { enabled: false, items: DEFAULTS };
    const parsed = JSON.parse(raw);
    return { enabled: !!parsed.enabled, items: Array.isArray(parsed.items) && parsed.items.length ? parsed.items : DEFAULTS };
  } catch {
    return { enabled: false, items: DEFAULTS };
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function fire(r: Reminder) {
  const body = "Tap to open MedSafe and log it — takes 20 seconds.";
  const options: NotificationOptions = {
    body,
    icon: "/medsafe-logo.png",
    badge: "/medsafe-logo.png",
    tag: `medsafe-${r.id}`,
    requireInteraction: false,
  };
  try {
    const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;
    if (reg && "showNotification" in reg) {
      await reg.showNotification(r.label, options);
      return;
    }
  } catch {}
  try {
    new Notification(r.label, options);
  } catch {}
}

export function LogReminders() {
  const [state, setState] = useState(() => load());
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [toast, setToast] = useState<string | null>(null);
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPerm("Notification" in window ? Notification.permission : "unsupported");
    try {
      const raw = localStorage.getItem(FIRED_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.day === todayKey()) firedRef.current = new Set(parsed.ids ?? []);
    } catch {}
  }, []);

  // persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  // the alarm loop — checks every 20s while MedSafe is open
  useEffect(() => {
    if (!state.enabled || perm !== "granted") return;
    const tick = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      for (const r of state.items) {
        const key = `${todayKey()}:${r.id}`;
        if (firedRef.current.has(key)) continue;
        if (r.time <= hhmm && minutesBetween(r.time, hhmm) <= 30) {
          firedRef.current.add(key);
          try {
            localStorage.setItem(FIRED_KEY, JSON.stringify({ day: todayKey(), ids: [...firedRef.current] }));
          } catch {}
          fire(r);
        }
      }
    };
    tick();
    const t = setInterval(tick, 20_000);
    return () => clearInterval(t);
  }, [state, perm]);

  const nextUp = useMemo(() => {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const upcoming = [...state.items].sort((a, b) => a.time.localeCompare(b.time)).find((r) => r.time > hhmm);
    return upcoming ?? [...state.items].sort((a, b) => a.time.localeCompare(b.time))[0];
  }, [state.items]);

  async function enable() {
    if (!("Notification" in window)) {
      setToast("This browser can't show reminders. Try Chrome on Android or add MedSafe to your home screen.");
      return;
    }
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") {
      setState((s) => ({ ...s, enabled: true }));
      setToast("Reminders on — we'll nudge you at your chosen times.");
      fire({ id: "welcome", time: "", label: "Reminders are on 🔔" });
    } else {
      setToast("Notifications are blocked. Allow them in your browser settings to get reminders.");
    }
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg">
            <BellRing className="h-4 w-4 text-primary" /> Log reminders
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A small alarm on your phone so logging never slips. Times stay on this device.
          </p>
        </div>
        {state.enabled && perm === "granted" ? (
          <button
            type="button"
            onClick={() => {
              setState((s) => ({ ...s, enabled: false }));
              setToast("Reminders paused.");
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <BellOff className="h-3.5 w-3.5" /> Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={enable}
            className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Turn on
          </button>
        )}
      </div>

      <ul className="mt-4 space-y-2">
        {state.items.map((r) => (
          <li key={r.id} className="flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2">
            <input
              type="time"
              value={r.time}
              onChange={(e) =>
                setState((s) => ({ ...s, items: s.items.map((x) => (x.id === r.id ? { ...x, time: e.target.value } : x)) }))
              }
              className="rounded-md border border-border bg-card px-2 py-1 text-sm tabular-nums"
              aria-label={`Reminder time for ${r.label}`}
            />
            <input
              value={r.label}
              onChange={(e) =>
                setState((s) => ({ ...s, items: s.items.map((x) => (x.id === r.id ? { ...x, label: e.target.value } : x)) }))
              }
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              aria-label="Reminder message"
            />
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, items: s.items.filter((x) => x.id !== r.id) }))}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
              aria-label="Remove reminder"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Quick add</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() =>
                setState((s) =>
                  s.items.some((x) => x.label === p.label)
                    ? s
                    : { ...s, items: [...s.items, { id: `r${Date.now()}`, time: p.time, label: p.label }] },
                )
              }
              className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-accent"
            >
              {p.label.split(" ")[0]} · {p.time}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() =>
            setState((s) => ({
              ...s,
              items: [...s.items, { id: `r${Date.now()}`, time: "09:00", label: "Time to log ✍️" }],
            }))
          }
          className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" /> Custom time
        </button>
        {state.enabled && perm === "granted" && nextUp && (
          <span className="text-xs text-muted-foreground">Next nudge at {nextUp.time}</span>
        )}
      </div>


      {perm === "denied" && (
        <p className="mt-3 rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
          Notifications are blocked for MedSafe. Enable them in your browser's site settings, then tap “Turn on”.
        </p>
      )}

      {toast && (
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-foreground">
          {toast}
        </div>
      )}
    </section>
  );
}

function minutesBetween(a: string, b: string) {
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  return bh * 60 + bm - (ah * 60 + am);
}
