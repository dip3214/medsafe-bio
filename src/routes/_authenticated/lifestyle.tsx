import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Moon, Activity, UtensilsCrossed, Sparkles, Target, Flame, Mic, MicOff, Camera, Check, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { LifestyleHeroBackground } from "@/components/LifestyleHeroBackground";
import { DailyMoodPrompt } from "@/components/DailyMoodPrompt";
import { useActiveMember } from "@/lib/active-member";
import { getLifestyleContext } from "@/lib/lifestyle-context";
import { useWeather } from "@/lib/use-weather";
import {
  listLifestyleLogs,
  upsertLifestyleLog,
  getLifestyleGoals,
  upsertLifestyleGoals,
  parseLifestyleUpdate,
  estimateMealCalories,
} from "@/lib/lifestyle.functions";

export const Route = createFileRoute("/_authenticated/lifestyle")({
  head: () => ({
    meta: [
      { title: "Lifestyle — MedSafe" },
      { name: "description", content: "A calm daily check-in for sleep, movement and meals. Set gentle goals and watch your rhythm build." },
    ],
  }),
  component: LifestylePage,
});

type Log = {
  log_date: string;
  sleep_hours: number | null;
  exercise_type: string | null;
  exercise_minutes: number | null;
  meals: string | null;
};

function useLifestyleContext() {
  const [ctx, setCtx] = useState(() => getLifestyleContext());
  useEffect(() => {
    const t = setInterval(() => setCtx(getLifestyleContext()), 60_000);
    return () => clearInterval(t);
  }, []);
  return ctx;
}

function LifestylePage() {
  const { active } = useActiveMember();
  if (active && active.segment !== "me") return <Navigate to="/dashboard" />;

  const qc = useQueryClient();
  const list = useServerFn(listLifestyleLogs);
  const upsert = useServerFn(upsertLifestyleLog);
  const getGoals = useServerFn(getLifestyleGoals);
  const saveGoals = useServerFn(upsertLifestyleGoals);
  const parse = useServerFn(parseLifestyleUpdate);
  const estimate = useServerFn(estimateMealCalories);

  const { data: logs = [] } = useQuery({
    queryKey: ["lifestyle-logs"],
    queryFn: () => list({ data: { days: 30 } }) as Promise<Log[]>,
  });
  const { data: goals } = useQuery({
    queryKey: ["lifestyle-goals"],
    queryFn: () => getGoals(),
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayLog = logs.find((l) => l.log_date === today);

  const [sleep, setSleep] = useState<string>("");
  const [exType, setExType] = useState<string>("walk");
  const [exMin, setExMin] = useState<string>("");
  const [meals, setMeals] = useState<string>("");
  const [nlText, setNlText] = useState<string>("");
  const [flash, setFlash] = useState<string | null>(null);
  const [calorieResult, setCalorieResult] = useState<string | null>(null);

  useEffect(() => {
    if (todayLog) {
      setSleep(todayLog.sleep_hours != null ? String(todayLog.sleep_hours) : "");
      setExType(todayLog.exercise_type || "walk");
      setExMin(todayLog.exercise_minutes != null ? String(todayLog.exercise_minutes) : "");
      setMeals(todayLog.meals || "");
    }
  }, [todayLog?.log_date]);

  function showFlash(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 1800);
  }

  const save = useMutation({
    mutationFn: (payload: Partial<Log>) =>
      upsert({
        data: {
          sleep_hours: payload.sleep_hours ?? undefined,
          exercise_type: payload.exercise_type ?? undefined,
          exercise_minutes: payload.exercise_minutes ?? undefined,
          meals: payload.meals ?? undefined,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lifestyle-logs"] });
      showFlash("Your log has been saved");
    },
  });

  const saveGoalsMut = useMutation({
    mutationFn: (g: { sleep_hours_target: number; exercise_min_per_day: number; exercise_days_per_week: number }) =>
      saveGoals({ data: g }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lifestyle-goals"] }),
  });

  const parseMut = useMutation({
    mutationFn: (text: string) => parse({ data: { text } }) as Promise<any>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lifestyle-logs"] });
      setNlText("");
      setVoiceText("");
      showFlash("Your log has been saved");
    },
  });

  function logManual() {
    const payload: Partial<Log> = {
      sleep_hours: sleep !== "" ? Number(sleep) : null,
      exercise_type: exType || null,
      exercise_minutes: exMin !== "" ? Number(exMin) : null,
      meals: meals || null,
    };
    save.mutate(payload);
  }

  // ----- Voice recording -----
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceText, setVoiceText] = useState<string>("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size < 1000) {
          showFlash("Recording too short");
          return;
        }
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append("file", blob, `recording.${mime.includes("mp4") ? "mp4" : "webm"}`);
          const r = await fetch("/api/transcribe", { method: "POST", body: form });
          const j = await r.json();
          const text = (j?.text || "").trim();
          if (!text) {
            showFlash("Couldn't hear that — try again");
            return;
          }
          setVoiceText(text);
        } catch (err: any) {
          showFlash(err?.message || "Transcription failed");
        } finally {
          setTranscribing(false);
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      showFlash("Microphone permission needed");
    }
  }
  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  // ----- Photo → calories -----
  const [estimating, setEstimating] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  async function onPhoto(file: File) {
    setEstimating(true);
    setCalorieResult(null);
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = () => rej(new Error("read failed"));
        r.readAsDataURL(file);
      });
      const { text } = await estimate({ data: { imageDataUrl: dataUrl, mimeType: file.type || "image/jpeg" } });
      setCalorieResult(text);
      // append to meals note
      const next = meals ? `${meals}\n${text}` : text;
      setMeals(next);
      save.mutate({ meals: next });
    } catch (err: any) {
      showFlash(err?.message || "Couldn't estimate");
    } finally {
      setEstimating(false);
    }
  }

  const stats = useMemo(() => computeStats(logs), [logs]);
  const recent = useMemo(() => logs.slice(0, 7).filter((l) => l.log_date !== today), [logs, today]);
  const displayName = active?.name?.split(/\s+/)[0] || "there";
  const ctx = useLifestyleContext();
  const { weather, refresh: refreshWeather, refreshing: weatherBusy } = useWeather();

  return (
    <SiteLayout>
      <DailyMoodPrompt memberId={active?.id ?? null} name={active?.name} />
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[520px] sm:min-h-[600px]">
        <LifestyleHeroBackground phase={ctx.phase} weather={weather} />
        {(() => {
          const isDay = ctx.ambient === "day";
          const isDusk = ctx.ambient === "dusk";
          // Adaptive text tokens per ambient — dark ink on bright skies, warm white on dusk/night
          const inkColor = isDay ? "#1a1410" : "#fdf6ec";
          const inkShadow = isDay
            ? "0 1px 0 rgba(255,255,255,0.5), 0 2px 12px rgba(255,240,220,0.7)"
            : isDusk
              ? "0 2px 18px rgba(30,10,40,0.55), 0 1px 2px rgba(0,0,0,0.4)"
              : "0 2px 24px rgba(0,0,0,0.65), 0 1px 2px rgba(0,0,0,0.5)";
          const subColor = isDay ? "#2a1f18" : "rgba(253,246,236,0.96)";
          const badgeClass = isDay
            ? "bg-white/60 text-[#3a1f10] ring-1 ring-black/10"
            : isDusk
              ? "bg-white/20 text-white ring-1 ring-white/30"
              : "bg-white/15 text-white ring-1 ring-white/25";
          // Only add a scrim on dusk/night; day stays open so animation reads clearly
          const scrim = isDay
            ? null
            : isDusk
              ? "bg-gradient-to-t from-black/50 via-black/15 to-transparent"
              : "bg-gradient-to-t from-black/70 via-black/25 to-transparent";
          return (
            <>
              {scrim && (
                <div
                  aria-hidden
                  className={`pointer-events-none absolute inset-x-0 bottom-0 h-2/3 ${scrim}`}
                />
              )}
              {/* Date + time pill — top-right, subtle so background stays visible */}
              <div
                className={`pointer-events-auto absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium backdrop-blur-md sm:right-8 sm:top-6 sm:text-xs ${badgeClass}`}
                style={{ textShadow: inkShadow }}
                aria-label={`${ctx.dayLabel} · ${ctx.timeLabel}`}
              >
                <span>{ctx.dayLabel}</span>
                <span className="opacity-60">·</span>
                <span className="tabular-nums">{ctx.timeLabel}</span>
                {weather && (
                  <>
                    <span className="opacity-60">·</span>
                    <span>{weather.label}</span>
                  </>
                )}
                <button
                  onClick={() => refreshWeather()}
                  disabled={weatherBusy}
                  className="ml-1 -mr-1 rounded-full p-1 hover:bg-white/20 disabled:opacity-50"
                  aria-label="Refresh location & weather"
                  title="Refresh weather"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-3 w-3 ${weatherBusy ? "animate-spin" : ""}`}>
                    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" />
                  </svg>
                </button>
              </div>
              <div className="relative mx-auto max-w-5xl px-4 pt-28 pb-16 text-left sm:pt-40 sm:pb-24">
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${badgeClass}`}>
                  <Sparkles className="h-3 w-3" /> {ctx.badge}
                </div>
                <h1
                  className="mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-6xl transition-colors duration-1000"
                  style={{ color: inkColor, textShadow: inkShadow }}
                >
                  {ctx.headline(displayName)}
                </h1>
                <p
                  className="mt-3 max-w-xl text-base sm:text-lg transition-colors duration-1000"
                  style={{ color: subColor, textShadow: inkShadow }}
                >
                  {ctx.sub}
                </p>
              </div>
            </>
          );
        })()}
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Daily log */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Today's check-in</h2>
            {flash && (
              <span className="inline-flex items-center gap-1 text-xs text-primary animate-fade-in">
                <Check className="h-3 w-3" /> {flash}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Auto-saves the moment you leave a field. One entry per day; edit anytime.
          </p>

          <div className="mt-5 grid gap-4">
            <Field icon={<Moon className="h-4 w-4" />} label="Sleep last night">
              <input
                type="number" step="0.25" min="0" max="14"
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
                onBlur={() => sleep !== "" && save.mutate({ sleep_hours: Number(sleep) })}
                placeholder="e.g. 7.5"
                className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <span className="ml-2 text-xs text-muted-foreground">hours</span>
            </Field>

            <Field icon={<Activity className="h-4 w-4" />} label="Movement">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={exType}
                  onChange={(e) => setExType(e.target.value)}
                  onBlur={() => save.mutate({ exercise_type: exType })}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {["walk", "run", "yoga", "gym", "other"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  type="number" min="0" max="240"
                  value={exMin}
                  onChange={(e) => setExMin(e.target.value)}
                  onBlur={() => exMin !== "" && save.mutate({ exercise_minutes: Number(exMin) })}
                  placeholder="minutes"
                  className="w-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </Field>

            <Field icon={<UtensilsCrossed className="h-4 w-4" />} label="Meals & notes">
              <textarea
                value={meals}
                onChange={(e) => setMeals(e.target.value)}
                onBlur={() => save.mutate({ meals })}
                rows={3}
                placeholder={ctx.mealsPlaceholder}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  ref={cameraInputRef}
                  type="file" accept="image/*" capture="environment"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); e.target.value = ""; }}
                />
                <input
                  ref={galleryInputRef}
                  type="file" accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); e.target.value = ""; }}
                />
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={estimating}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
                >
                  {estimating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                  {estimating ? "Reading photo…" : "Take photo"}
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={estimating}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
                >
                  <UtensilsCrossed className="h-3 w-3" />
                  Upload from gallery
                </button>
                {calorieResult && <span className="text-xs text-muted-foreground">{calorieResult}</span>}
              </div>
            </Field>
          </div>

          {/* Explicit save for the manual form */}
          <div className="mt-5 flex items-center justify-end gap-3">
            {save.isPending && <span className="text-xs text-muted-foreground">Saving…</span>}
            <button
              type="button"
              onClick={logManual}
              disabled={save.isPending}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Log today's check-in
            </button>
          </div>

          {/* Quick log: text + voice */}
          <div className="mt-6 rounded-xl border border-dashed border-border bg-background/60 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Or just tell me
              </div>
              {parseMut.isPending && <span className="text-xs text-muted-foreground">Reading…</span>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Type or hold the mic. e.g. "slept 6.5 hours, went for a 20 min run this morning"
            </p>
            <div className="mt-2 flex gap-2">
              <input
                value={nlText}
                onChange={(e) => setNlText(e.target.value)}
                placeholder={ctx.quickPromptPlaceholder}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && nlText.trim()) parseMut.mutate(nlText.trim());
                }}
              />
              <button
                type="button"
                onClick={() => (recording ? stopRecording() : startRecording())}
                disabled={transcribing}
                title={recording ? "Stop" : "Voice note"}
                className={`grid place-items-center rounded-md border px-3 py-2 text-xs font-medium ${
                  recording ? "border-destructive bg-destructive text-destructive-foreground animate-pulse" : "border-border bg-background hover:bg-accent"
                } disabled:opacity-50`}
              >
                {transcribing ? <Loader2 className="h-4 w-4 animate-spin" /> : recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <button
                onClick={() => nlText.trim() && parseMut.mutate(nlText.trim())}
                disabled={parseMut.isPending || !nlText.trim()}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Log it
              </button>
            </div>

            {/* Voice transcript preview + explicit Log it */}
            {voiceText && (
              <div className="mt-3 rounded-lg border border-border bg-background p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Voice transcript
                </div>
                <p className="mt-1 text-sm text-foreground/90">{voiceText}</p>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setVoiceText("")}
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => parseMut.mutate(voiceText)}
                    disabled={parseMut.isPending}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    Log voice note
                  </button>
                </div>
              </div>
            )}
          </div>


          {/* Recent days */}
          {recent.length > 0 && (
            <div className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last few days</div>
              <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                {recent.map((l) => (
                  <li key={l.log_date} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-xs">
                    <span className="w-24 font-medium">{formatDayLabel(l.log_date)}</span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Moon className="h-3 w-3" /> {l.sleep_hours ?? "—"}h
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Activity className="h-3 w-3" /> {l.exercise_minutes ? `${l.exercise_minutes}m ${l.exercise_type ?? ""}` : "—"}
                    </span>
                    {l.meals && (
                      <span className="line-clamp-1 flex-1 min-w-0 text-muted-foreground">· {l.meals}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Stats + Goals */}
        <div className="space-y-6">
          <StatsCard stats={stats} />
          <GoalsCard
            goals={goals}
            stats={stats}
            onSave={(g) => saveGoalsMut.mutate(g)}
            saving={saveGoalsMut.isPending}
          />
        </div>
      </section>
    </SiteLayout>
  );
}

function formatDayLabel(d: string) {
  const dt = new Date(d + "T00:00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((today.getTime() - dt.getTime()) / 86400000);
  if (diff === 1) return "Yesterday";
  if (diff < 7) return dt.toLocaleDateString(undefined, { weekday: "short" });
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
        <span className="text-primary">{icon}</span> {label}
      </label>
      <div>{children}</div>
    </div>
  );
}

type Stats = {
  streak: number;
  weekAvgSleep: number | null;
  weekTotalMin: number;
  prevWeekAvgSleep: number | null;
  prevWeekTotalMin: number;
  daysExercised: number;
};

function computeStats(logs: Log[]): Stats {
  const byDate = new Map(logs.map((l) => [l.log_date, l]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
    if (byDate.has(d)) streak++;
    else break;
  }

  function windowStats(startOffset: number) {
    let sleepSum = 0, sleepDays = 0, minSum = 0, exDays = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getTime() - (startOffset + i) * 86400000).toISOString().slice(0, 10);
      const l = byDate.get(d);
      if (!l) continue;
      if (l.sleep_hours != null) { sleepSum += Number(l.sleep_hours); sleepDays++; }
      if (l.exercise_minutes) { minSum += l.exercise_minutes; exDays++; }
    }
    return { avgSleep: sleepDays ? sleepSum / sleepDays : null, totalMin: minSum, exDays };
  }

  const cur = windowStats(0);
  const prev = windowStats(7);

  return {
    streak,
    weekAvgSleep: cur.avgSleep,
    weekTotalMin: cur.totalMin,
    prevWeekAvgSleep: prev.avgSleep,
    prevWeekTotalMin: prev.totalMin,
    daysExercised: cur.exDays,
  };
}

function StatsCard({ stats }: { stats: Stats }) {
  const sleepTrend =
    stats.weekAvgSleep && stats.prevWeekAvgSleep ? stats.weekAvgSleep - stats.prevWeekAvgSleep : 0;
  const moveTrend = stats.weekTotalMin - stats.prevWeekTotalMin;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="font-display text-lg">This week's rhythm</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Streak" value={`${stats.streak} day${stats.streak === 1 ? "" : "s"}`} hint="Days in a row logged" icon={<Flame className="h-4 w-4" />} />
        <Stat label="Avg sleep" value={stats.weekAvgSleep ? `${stats.weekAvgSleep.toFixed(1)}h` : "—"} hint={trendHint(sleepTrend, "h")} icon={<Moon className="h-4 w-4" />} />
        <Stat label="Movement" value={`${stats.weekTotalMin} min`} hint={trendHint(moveTrend, "m")} icon={<Activity className="h-4 w-4" />} />
      </div>
    </div>
  );
}

function Stat({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span> {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function trendHint(delta: number, unit: string) {
  if (Math.abs(delta) < 0.1) return "Steady vs last week";
  const better = delta > 0 ? "up" : "down";
  return `${better === "up" ? "▲" : "▼"} ${Math.abs(delta).toFixed(unit === "h" ? 1 : 0)}${unit} vs last week`;
}

function GoalsCard({
  goals, stats, onSave, saving,
}: { goals: any; stats: Stats; onSave: (g: any) => void; saving: boolean }) {
  const [sleepT, setSleepT] = useState<string>("7.5");
  const [minT, setMinT] = useState<string>("30");
  const [daysT, setDaysT] = useState<string>("5");

  useEffect(() => {
    if (goals) {
      setSleepT(String(goals.sleep_hours_target ?? 7.5));
      setMinT(String(goals.exercise_min_per_day ?? 30));
      setDaysT(String(goals.exercise_days_per_week ?? 5));
    }
  }, [goals]);

  const sleepPct = clampPct((stats.weekAvgSleep ?? 0) / Number(sleepT || 7.5));
  const daysPct = clampPct(stats.daysExercised / Number(daysT || 5));

  const message = celebrationMessage({
    sleepMet: stats.weekAvgSleep != null && stats.weekAvgSleep >= Number(sleepT),
    daysMet: stats.daysExercised >= Number(daysT),
    streak: stats.streak,
    daysExercised: stats.daysExercised,
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg">Gentle goals</h3>
      </div>
      <div className="mt-4 space-y-4">
        <Progress label={`Sleep · ${sleepT}h target`} pct={sleepPct} />
        <Progress label={`Movement · ${daysT} days / week`} pct={daysPct} />
      </div>
      <div className="mt-5 rounded-lg bg-primary/8 p-3 text-sm text-foreground/85">{message}</div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
        <label>
          Sleep hrs
          <input type="number" step="0.5" min="4" max="12" value={sleepT} onChange={(e) => setSleepT(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1" />
        </label>
        <label>
          Min/day
          <input type="number" min="0" max="180" value={minT} onChange={(e) => setMinT(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1" />
        </label>
        <label>
          Days/wk
          <input type="number" min="0" max="7" value={daysT} onChange={(e) => setDaysT(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1" />
        </label>
      </div>
      <button
        onClick={() => onSave({ sleep_hours_target: Number(sleepT), exercise_min_per_day: Number(minT), exercise_days_per_week: Number(daysT) })}
        disabled={saving}
        className="mt-3 w-full rounded-md border border-border bg-background py-1.5 text-xs font-medium hover:bg-accent"
      >
        {saving ? "Saving…" : "Update goals"}
      </button>
    </div>
  );
}

function clampPct(v: number) { return Math.max(0, Math.min(100, Math.round(v * 100))); }

function Progress({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function celebrationMessage({
  sleepMet, daysMet, streak, daysExercised,
}: { sleepMet: boolean; daysMet: boolean; streak: number; daysExercised: number }) {
  if (sleepMet && daysMet) return `You've hit both your sleep and movement targets this week — that consistency is really something. Keep this pace.`;
  if (daysMet) return `${daysExercised} active days this week — your body's noticing. Try adding a gentler wind-down tonight.`;
  if (sleepMet) return `Your sleep is holding steady above target. Even a short 15-minute walk today would round the week out beautifully.`;
  if (streak >= 3) return `${streak} days in a row of just showing up here — that's the hardest part. The numbers will follow.`;
  if (streak === 0) return `A single line today is enough to begin. No pressure — just a note about how you slept.`;
  return `Small notes, honest ones — that's all this needs. Keep going.`;
}
