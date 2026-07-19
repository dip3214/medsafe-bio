import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { QuickActions } from "@/components/QuickActions";
import { groupDocs, type MedicalDoc, type VisitGroup } from "@/lib/medsafe-types";
import { listMedicalDocs } from "@/lib/medsafe.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, AlertTriangle, CalendarDays, FlaskConical, Pill, TrendingUp, TrendingDown, Upload, UserRound, Sparkles, HeartPulse, ShieldCheck, FileDown, Syringe, ChevronDown, ChevronRight } from "lucide-react";
import { useActiveMember } from "@/lib/active-member";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MedSafe" },
      { name: "description", content: "Trends, anomalies and critical clinical events from your reports — visualized over time." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const listDocs = useServerFn(listMedicalDocs);
  const { active, members, setActiveId } = useActiveMember();
  const { data: docs = [] } = useQuery({
    queryKey: ["medsafe-docs", active?.id ?? null],
    queryFn: () => listDocs({ data: { memberId: active?.id } }) as Promise<MedicalDoc[]>,
  });
  const groups = groupDocs(docs);
  const patient = [...docs].reverse().find((d) => d.patientName);

  const segmentCards: { key: "me" | "parents" | "kids"; label: string; sub: string }[] = [
    { key: "me", label: "MedSafe Me", sub: "Your own timeline" },
    { key: "parents", label: "MedSafe Parents", sub: "Mum · Dad · in-laws" },
    { key: "kids", label: "MedSafe Kids", sub: "Vaccines & growth" },
  ];
  const firstOf = (seg: "me" | "parents" | "kids") =>
    members.find((m) => m.segment === seg && m.is_default) || members.find((m) => m.segment === seg);


  const series = useMemo(() => {
    const map = new Map<string, { date: string; value: number; flag?: string }[]>();
    for (const d of docs) for (const v of d.labValues || []) {
      const num = typeof v.value === "number" ? v.value : parseFloat(String(v.value));
      if (Number.isFinite(num)) {
        const key = v.name.trim();
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ date: d.date, value: num, flag: v.flag });
      }
    }
    for (const arr of map.values()) arr.sort((a, b) => a.date.localeCompare(b.date));
    return Array.from(map.entries()).map(([name, points]) => ({ name, points }));
  }, [docs]);

  const criticals = useMemo(() => {
    const out: { doc: string; date: string; name: string; value: string; flag?: string }[] = [];
    for (const d of docs) for (const v of d.labValues || []) {
      if (v.flag === "high" || v.flag === "low" || v.flag === "critical") {
        out.push({ doc: d.title, date: d.date, name: v.name, value: `${v.value} ${v.unit || ""}`, flag: v.flag });
      }
    }
    return out.slice(-12).reverse();
  }, [docs]);

  const totalMeds = docs.flatMap((d) => d.medicines || []).length;
  const improvements = useMemo(() => computeImprovements(series), [series]);
  const visitDelta = useMemo(() => computeVisitDelta(groups), [groups]);

  return (
    <SiteLayout>
      <QuickActions />
      <section className="mx-auto max-w-7xl px-4 pt-2 pb-10">
        {/* Segment quick-switcher */}
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {segmentCards.map((s) => {
            const m = firstOf(s.key);
            const isActive = active?.segment === s.key;
            const tone =
              s.key === "me"
                ? "bg-me text-me-foreground"
                : s.key === "parents"
                  ? "bg-parents text-parents-foreground"
                  : "bg-kids text-kids-foreground";
            return (
              <button
                key={s.key}
                disabled={!m}
                onClick={() => m && setActiveId(m.id)}
                className={`group rounded-2xl border p-4 text-left transition hover:scale-[1.01] ${tone} ${
                  isActive ? "ring-2 ring-primary shadow-lg" : "border-border/50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="font-serif text-xl">{s.label}</div>
                <div className="mt-1 text-xs opacity-80">{m ? s.sub : "Add a family member"}</div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-primary">Health overview</div>
            <h1 className="mt-1 font-serif text-3xl tracking-tight sm:text-4xl">
              {patient?.patientName ? `${patient.patientName.split(" ")[0]}'s health story` : "Your health story"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every clinical event from your reports, lined up so you can see what's getting better and what needs attention.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/summary" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent">
              <FileDown className="h-4 w-4" /> Export summary report
            </Link>
            <Link to="/upload" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <Upload className="h-4 w-4" /> Add document
            </Link>
          </div>
        </div>

        {patient?.patientName && (
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <UserRound className="h-4 w-4 text-primary" />
            <span className="font-medium">{patient.patientName}</span>
            {(patient.patientAge || patient.patientGender) && (
              <span className="text-muted-foreground">· {[patient.patientAge, patient.patientGender].filter(Boolean).join(" · ")}</span>
            )}
          </div>
        )}


        {visitDelta && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-accent/30 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-primary inline-flex items-center gap-1.5">
                  <HeartPulse className="h-3.5 w-3.5" /> Visit-to-visit clinical summary
                </div>
                <h2 className="mt-1 text-xl font-semibold">{visitDelta.prevDate} → {visitDelta.latestDate}</h2>
                <p className="text-sm text-muted-foreground">
                  Comparing your last two visits ({visitDelta.daysApart} days apart). Auto-generated for you and your doctor.
                </p>
              </div>
              <div className="rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Clinician-grade summary
              </div>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <SummaryColumn title="Top 3 improvements" tone="good" items={visitDelta.improvements} emptyText="No clear improvements between these two visits yet." />
              <SummaryColumn title="Top 3 concerns" tone="bad" items={visitDelta.concerns} emptyText="No flagged concerns between these two visits." />
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={CalendarDays} label="Visits" value={groups.length} />
          <Kpi icon={FlaskConical} label="Reports" value={docs.filter((d) => d.kind === "report").length} />
          <Kpi icon={Pill} label="Prescriptions" value={docs.filter((d) => d.kind === "prescription").length} />
          <Kpi icon={Activity} label="Medicines tracked" value={totalMeds} />
        </div>

        {active?.segment === "kids" && <KidsVaccinations dob={active?.dob ?? null} name={active?.name ?? "Your child"} />}

        {improvements.length > 0 && (
          <div className="mt-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold inline-flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> What's improved since your first report
                </h2>
                <p className="text-sm text-muted-foreground">Values that were once out of range and are now heading the right way.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {improvements.filter((i) => i.improved).slice(0, 6).map((i) => <ImprovementCard key={i.name} item={i} />)}
            </div>
            {improvements.filter((i) => !i.improved).length > 0 && (
              <>
                <h3 className="mt-8 text-sm font-semibold text-foreground/80 inline-flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" /> Still needs attention
                </h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {improvements.filter((i) => !i.improved).slice(0, 6).map((i) => <ImprovementCard key={i.name} item={i} />)}
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold">All clinical trends</h2>
            <p className="text-sm text-muted-foreground">Same metric across visits, plotted over time.</p>
            {series.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Upload reports with lab values (HbA1c, LDL, BP, eGFR…) to see trends here.
              </div>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {series.slice(0, 8).map((s) => <ChartCard key={s.name} name={s.name} points={s.points} />)}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Critical & out-of-range</h2>
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              {criticals.length === 0 ? (
                <div className="text-sm text-muted-foreground">No abnormal values detected yet.</div>
              ) : (
                <ul className="space-y-3 text-sm">
                  {criticals.map((c, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <AlertTriangle className={`mt-0.5 h-4 w-4 ${c.flag === "critical" ? "text-destructive" : "text-orange-600"}`} />
                      <div>
                        <div className="font-medium">{c.name} · {c.value}</div>
                        <div className="text-xs text-muted-foreground">{c.date} · {c.doc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-6 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium"><TrendingUp className="h-4 w-4 text-primary" /> Next checkup</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {docs.length === 0 ? "Add documents to enable smart reminders." : "Based on your last visit, consider a follow-up panel in 8–12 weeks. We'll notify you."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

type VisitItem = { name: string; from: number; to: number; delta: number; pct: number; unit?: string };
type VisitDelta = { latestDate: string; prevDate: string; daysApart: number; improvements: VisitItem[]; concerns: VisitItem[] };

function computeVisitDelta(groups: VisitGroup[]): VisitDelta | null {
  if (groups.length < 2) return null;
  const [latest, prev] = groups;
  const labsOf = (g: VisitGroup) => {
    const m = new Map<string, { value: number; unit?: string }>();
    for (const d of g.docs) for (const v of d.labValues || []) {
      const num = typeof v.value === "number" ? v.value : parseFloat(String(v.value));
      if (Number.isFinite(num)) m.set(v.name.trim(), { value: num, unit: v.unit });
    }
    return m;
  };
  const a = labsOf(prev);
  const b = labsOf(latest);
  const improvements: VisitItem[] = [];
  const concerns: VisitItem[] = [];
  for (const [name, latestVal] of b) {
    const prevVal = a.get(name);
    if (!prevVal) continue;
    const dir = directionFor(name);
    if (dir === "neutral") continue;
    const delta = latestVal.value - prevVal.value;
    if (delta === 0) continue;
    const pct = prevVal.value !== 0 ? (delta / prevVal.value) * 100 : 0;
    const improved = dir === "lower-better" ? delta < 0 : delta > 0;
    const item: VisitItem = { name, from: prevVal.value, to: latestVal.value, delta, pct, unit: latestVal.unit };
    (improved ? improvements : concerns).push(item);
  }
  improvements.sort((x, y) => Math.abs(y.pct) - Math.abs(x.pct));
  concerns.sort((x, y) => Math.abs(y.pct) - Math.abs(x.pct));
  const daysApart = Math.max(0, Math.round((new Date(latest.startDate).getTime() - new Date(prev.endDate).getTime()) / (24 * 60 * 60 * 1000)));
  return { latestDate: latest.startDate, prevDate: prev.endDate, daysApart, improvements: improvements.slice(0, 3), concerns: concerns.slice(0, 3) };
}

function SummaryColumn({ title, items, tone, emptyText }: { title: string; items: VisitItem[]; tone: "good" | "bad"; emptyText: string }) {
  const accent = tone === "good" ? "text-green-700 bg-green-500/10 border-green-500/30" : "text-orange-700 bg-orange-500/10 border-orange-500/30";
  const Icon = tone === "good" ? TrendingDown : TrendingUp;
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${accent}`}>
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      {items.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p> : (
        <ol className="mt-3 space-y-2">
          {items.map((it, i) => {
            const arrow = it.delta < 0 ? "▼" : "▲";
            return (
              <li key={it.name} className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3">
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="truncate text-sm font-medium">{it.name}</div>
                    <div className={`text-xs font-semibold ${tone === "good" ? "text-green-700" : "text-orange-700"}`}>{arrow} {Math.abs(it.pct).toFixed(0)}%</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {it.from}{it.unit ? ` ${it.unit}` : ""} → <span className="font-medium text-foreground">{it.to}{it.unit ? ` ${it.unit}` : ""}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4" /> {label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function ChartCard({ name, points }: { name: string; points: { date: string; value: number }[] }) {
  const values = points.map((p) => p.value);
  const last = values[values.length - 1];
  const prev = values.length > 1 ? values[values.length - 2] : undefined;
  const delta = prev != null ? last - prev : 0;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">
          {last} {prev != null && (delta === 0 ? "·" : delta > 0 ? `▲ +${delta.toFixed(1)}` : `▼ ${delta.toFixed(1)}`)}
        </div>
      </div>
      <div className="mt-2 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 190)" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="oklch(0.52 0.12 185)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type Improvement = {
  name: string; first: number; latest: number; delta: number; pct: number; improved: boolean;
  direction: "lower-better" | "higher-better" | "neutral"; firstFlag?: string; latestFlag?: string; message: string;
};

const LOWER_BETTER = ["hba1c", "glucose", "fasting", "fbs", "ppbs", "ldl", "triglyceride", "tg", "cholesterol", "creatinine", "urea", "alt", "ast", "sgpt", "sgot", "bilirubin", "bp", "blood pressure", "systolic", "diastolic", "tsh", "crp", "esr", "uric acid"];
const HIGHER_BETTER = ["hdl", "hemoglobin", "hb", "platelet", "vitamin d", "vitamin b12", "egfr", "iron", "ferritin", "ft4"];

function directionFor(name: string): Improvement["direction"] {
  const n = name.toLowerCase();
  if (HIGHER_BETTER.some((k) => n.includes(k))) return "higher-better";
  if (LOWER_BETTER.some((k) => n.includes(k))) return "lower-better";
  return "neutral";
}

function computeImprovements(series: { name: string; points: { date: string; value: number; flag?: string }[] }[]): Improvement[] {
  const out: Improvement[] = [];
  for (const s of series) {
    if (s.points.length < 2) continue;
    const first = s.points[0];
    const latest = s.points[s.points.length - 1];
    const direction = directionFor(s.name);
    if (direction === "neutral") continue;
    const delta = latest.value - first.value;
    if (delta === 0) continue;
    const pct = first.value !== 0 ? (delta / first.value) * 100 : 0;
    const improved = direction === "lower-better" ? delta < 0 : delta > 0;
    const arrow = delta < 0 ? "dropped" : "rose";
    const message = improved
      ? `${s.name} ${arrow} from ${first.value} to ${latest.value} — moving in a healthier direction.`
      : `${s.name} ${arrow} from ${first.value} to ${latest.value} — worth discussing with your doctor.`;
    out.push({ name: s.name, first: first.value, latest: latest.value, delta, pct, improved, direction, firstFlag: first.flag, latestFlag: latest.flag, message });
  }
  return out.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
}

function ImprovementCard({ item }: { item: Improvement }) {
  const Icon = item.improved ? TrendingDown : TrendingUp;
  const tone = item.improved ? "border-green-500/30 bg-green-500/5" : "border-orange-500/30 bg-orange-500/5";
  const iconTone = item.improved ? "text-green-600" : "text-orange-600";
  const arrowSign = item.delta < 0 ? "▼" : "▲";
  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold">{item.name}</div>
        <Icon className={`h-4 w-4 ${iconTone}`} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{item.latest}</span>
        <span className="text-xs text-muted-foreground">was {item.first}</span>
      </div>
      <div className={`mt-1 text-xs font-medium ${iconTone}`}>
        {arrowSign} {Math.abs(item.delta).toFixed(2)} ({Math.abs(item.pct).toFixed(0)}%)
      </div>
      <p className="mt-2 text-xs text-foreground/75">{item.message}</p>
    </div>
  );
}

/* ─────────────────  MedSafe Kids · vaccination schedule  ─────────────── */

type VaxItem = { ageLabel: string; ageMonths: number; vaccine: string; note?: string };

// India IAP schedule condensed — the essentials caregivers actually need at a glance.
const IAP_SCHEDULE: VaxItem[] = [
  { ageLabel: "Birth", ageMonths: 0, vaccine: "BCG, OPV-0, Hep-B 1" },
  { ageLabel: "6 weeks", ageMonths: 1.5, vaccine: "DTwP/DTaP 1, Hib 1, IPV 1, Hep-B 2, PCV 1, Rota 1" },
  { ageLabel: "10 weeks", ageMonths: 2.5, vaccine: "DTwP 2, Hib 2, IPV 2, PCV 2, Rota 2" },
  { ageLabel: "14 weeks", ageMonths: 3.5, vaccine: "DTwP 3, Hib 3, IPV 3, PCV 3, Rota 3" },
  { ageLabel: "6 months", ageMonths: 6, vaccine: "Hep-B 3, OPV 1", note: "Flu shot annually from 6m" },
  { ageLabel: "9 months", ageMonths: 9, vaccine: "MMR 1", note: "Typhoid conjugate from 9m" },
  { ageLabel: "12 months", ageMonths: 12, vaccine: "Hepatitis A 1" },
  { ageLabel: "15 months", ageMonths: 15, vaccine: "MMR 2, Varicella 1, PCV booster" },
  { ageLabel: "16–18 months", ageMonths: 17, vaccine: "DTwP B1, Hib B1, IPV B1" },
  { ageLabel: "18–19 months", ageMonths: 18.5, vaccine: "Hepatitis A 2, Varicella 2" },
  { ageLabel: "4–6 years", ageMonths: 60, vaccine: "DTwP B2, OPV 2, MMR 3" },
  { ageLabel: "9–14 years (girls)", ageMonths: 108, vaccine: "HPV (2 doses, 6m apart)" },
  { ageLabel: "10–12 years", ageMonths: 120, vaccine: "Tdap / Td booster" },
];

function KidsVaccinations({ dob, name }: { dob: string | null; name: string }) {
  const ageMonths = dob ? Math.max(0, (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.4375)) : null;
  const next = ageMonths != null ? IAP_SCHEDULE.find((v) => v.ageMonths >= ageMonths) : null;
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-kids p-6 text-kids-foreground shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
            <Syringe className="h-3.5 w-3.5" /> MedSafe Kids · Vaccination schedule
          </div>
          <h2 className="mt-1 font-serif text-2xl">
            {name.split(" ")[0]}'s immunisations
          </h2>
          <p className="mt-1 text-sm opacity-80">
            Based on the IAP (India) schedule. We highlight what's next so you never miss a dose.
          </p>
        </div>
        {next && (
          <div className="rounded-xl bg-background/70 px-4 py-2 text-sm shadow-sm">
            <div className="text-[11px] uppercase tracking-wider opacity-70">Next up</div>
            <div className="font-semibold">{next.ageLabel}</div>
            <div className="text-xs opacity-90">{next.vaccine}</div>
          </div>
        )}
      </div>

      {/* Certificate upload */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-background/70 p-4">
        <div>
          <div className="text-sm font-semibold">Upload a vaccination certificate</div>
          <div className="text-xs opacity-75">
            Add {name.split(" ")[0]}'s IAP or hospital certificate — we'll extract the vaccines and dates.
          </div>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110"
        >
          <Upload className="h-4 w-4" /> Upload certificate
        </Link>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {IAP_SCHEDULE.map((v) => {
          const done = ageMonths != null && ageMonths >= v.ageMonths + 1;
          const upcoming = next?.ageLabel === v.ageLabel;
          return (
            <li
              key={v.ageLabel}
              className={`rounded-xl border p-3 text-sm shadow-sm ring-1 ${
                upcoming
                  ? "border-primary/40 bg-background/90 ring-primary/30"
                  : done
                    ? "border-transparent bg-background/50 opacity-80"
                    : "border-transparent bg-background/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{v.ageLabel}</span>
                {done && <span className="text-[10px] font-semibold uppercase tracking-wider text-green-700">Done</span>}
                {upcoming && <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Next</span>}
              </div>
              <div className="mt-1 text-xs">{v.vaccine}</div>
              {v.note && <div className="mt-1 text-[11px] opacity-70">{v.note}</div>}
            </li>
          );
        })}
      </ol>

      {!dob && (
        <p className="mt-4 text-xs opacity-70">
          Tip: add your child's date of birth in Family to auto-highlight the next due vaccine.
        </p>
      )}
    </div>
  );
}
