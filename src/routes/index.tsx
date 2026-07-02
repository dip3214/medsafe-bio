import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { ArrowRight, Lock, FlaskConical, Stethoscope, Sparkles, Upload as UploadIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listFlaggedLatest } from "@/lib/medsafe.functions";
import { useActiveMember } from "@/lib/active-member";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedSafe — Your family's health, finally in one place." },
      { name: "description", content: "MedSafe organizes every prescription, lab report and medical image into a clean clinical timeline — and lets you ask questions about it in plain language." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <SiteLayout>
      <Hero />
      <Segments />
      <Trust />
    </SiteLayout>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
      <div>
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          One family. One health record.
        </span>
        <h1 className="mt-5 font-display text-5xl leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
          Your family's health, <span className="italic text-primary">finally</span> in one place.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          MedSafe organizes every prescription, lab report and medical image into a clean clinical
          timeline — and lets you ask questions about it in plain language.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Get started — it's free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-accent">
            See your timeline
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge icon={Lock}>End-to-end encrypted</Badge>
          <Badge icon={FlaskConical}>Built with NABL-accredited labs</Badge>
          <Badge icon={Stethoscope}>Reviewed by MD physicians</Badge>
        </div>
      </div>

      <LatestEventsCard />
    </section>
  );
}

function Badge({ icon: Icon, children }: { icon: typeof Lock; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
      <Icon className="h-3 w-3" /> {children}
    </span>
  );
}

function LatestEventsCard() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { active } = useActiveMember();
  const fetchFlagged = useServerFn(listFlaggedLatest);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["flagged-latest", active?.id ?? null],
    queryFn: () => fetchFlagged({ data: { memberId: active?.id } }) as Promise<any[]>,
    enabled: authed,
    staleTime: 30_000,
  });

  if (!authed) return <SampleEventsCard />;

  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">
          {active ? `${active.name.split(" ")[0]}'s flagged values` : "Your flagged values"}
        </div>
        <div className="text-xs text-muted-foreground">Updated automatically</div>
      </div>
      {isLoading ? (
        <div className="mt-6 grid place-items-center py-10 text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/50 py-10 text-center">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground">
            <UploadIcon className="h-5 w-5" />
          </div>
          <div className="text-sm font-medium">No flagged values yet</div>
          <p className="max-w-xs text-xs text-muted-foreground">
            Upload a report to see out-of-range or critical values for {active?.name ?? "your profile"} here.
          </p>
          <Link to="/upload" className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            Upload a report <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-border">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-4">
              <div className="min-w-0">
                <div className="truncate font-medium">{r.name}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  Tested {r.date}{r.refRange ? ` · Ref ${r.refRange}` : ""}
                </div>
              </div>
              <div className="text-right text-lg font-semibold tabular-nums">
                {r.value}{r.unit ? ` ${r.unit}` : ""}
              </div>
              <span className={
                "rounded-full px-2.5 py-1 text-[11px] font-medium " +
                (r.flag === "critical"
                  ? "bg-destructive/15 text-destructive"
                  : r.flag === "high"
                  ? "bg-orange-500/15 text-orange-700"
                  : "bg-blue-500/15 text-blue-700")
              }>
                {r.flag}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SampleEventsCard() {
  const rows = [
    { name: "HbA1c", date: "12 Jun 2026", ref: "Ref 4.0–5.6%", value: "6.4%", flag: "Out of range", tone: "bad" },
    { name: "LDL Cholesterol", date: "12 Jun 2026", ref: "Ref <100 mg/dL", value: "118", flag: "Borderline", tone: "warn" },
    { name: "Vitamin D", date: "12 Jun 2026", ref: "Ref 30–100 ng/mL", value: "42", flag: "Within range", tone: "good" },
  ] as const;
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">Sample timeline</div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sample data</span>
      </div>
      <div className="mt-4 divide-y divide-border">
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-4">
            <div className="min-w-0">
              <div className="truncate font-medium">{r.name}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">Tested {r.date} · {r.ref}</div>
            </div>
            <div className="text-right text-lg font-semibold tabular-nums">{r.value}</div>
            <span className={
              "rounded-full px-2.5 py-1 text-[11px] font-medium " +
              (r.tone === "bad"
                ? "bg-destructive/15 text-destructive"
                : r.tone === "warn"
                ? "bg-amber-500/15 text-amber-700"
                : "bg-emerald-500/15 text-emerald-700")
            }>
              {r.flag}
            </span>
          </div>
        ))}
      </div>
      <Link to="/auth" className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
        Sign in to see your own values <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

type Seg = "kids" | "parents" | "me";
const SEG_CARDS: { segment: Seg; surface: string; badge: string; title: string; desc: string }[] = [
  {
    segment: "kids",
    surface: "bg-kids text-kids-foreground",
    badge: "MedSafe Kids",
    title: "Because little ones need a big record.",
    desc: "Vaccination certificates, growth charts, school medicals — held safely from day one.",
  },
  {
    segment: "parents",
    surface: "bg-parents text-parents-foreground",
    badge: "MedSafe Parents",
    title: "Care for the ones who cared for you.",
    desc: "A gentle companion for ageing parents — medications, BP, sugar, follow-ups, all in one calm view.",
  },
  {
    segment: "me",
    surface: "bg-me text-me-foreground",
    badge: "MedSafe Me",
    title: "Your health story, on your terms.",
    desc: "Every lab, every prescription, organized by visit and trended over time.",
  },
];

function Segments() {
  const navigate = useNavigate();
  const { members, setActiveId } = useActiveMember();
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  function onExplore(seg: Seg) {
    if (!authed) {
      navigate({ to: "/auth" });
      return;
    }
    const existing = members.find((m) => m.segment === seg);
    if (existing) {
      setActiveId(existing.id);
      navigate({ to: "/dashboard" });
      return;
    }
    if (seg === "me") {
      // Me segment always has a default profile from signup; fall back to dashboard.
      const def = members.find((m) => m.is_default) || members[0];
      if (def) {
        setActiveId(def.id);
        navigate({ to: "/dashboard" });
        return;
      }
    }
    navigate({ to: "/onboard/$segment", params: { segment: seg } });
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 md:grid-cols-3">
      {SEG_CARDS.map((c) => (
        <button
          key={c.segment}
          onClick={() => onExplore(c.segment)}
          className={`group flex flex-col rounded-3xl p-7 text-left transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 ${c.surface}`}
        >
          <span className="inline-flex w-fit items-center rounded-full bg-card/60 px-3 py-1 text-xs font-semibold backdrop-blur">
            {c.badge}
          </span>
          <h3 className="mt-5 font-display text-3xl leading-tight">{c.title}</h3>
          <p className="mt-3 text-sm opacity-90">{c.desc}</p>
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold opacity-80 transition group-hover:gap-2 group-hover:opacity-100">
            Explore <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      ))}
    </section>
  );
}

function Trust() {
  const items = [
    { t: "AI you can audit.", d: "Every answer is grounded in a specific report or lab value from your timeline — and quotes the source." },
    { t: "Visit-aware history.", d: "Labs and prescriptions within a 10-day window are linked to the same visit, with the right doctor attached." },
    { t: "Built for Indian families.", d: "Three audiences — Kids, Parents, Me — one shared record for the whole family, DPDP-aligned." },
  ];
  return (
    <section className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Why MedSafe
            </div>
            <h2 className="mt-2 font-display text-4xl">Quiet software. Loud clinical clarity.</h2>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((i) => (
            <div key={i.t} className="rounded-2xl border border-border bg-card p-6">
              <div className="text-lg font-semibold">{i.t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{i.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
