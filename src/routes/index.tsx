import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, HeartPulse, ShieldCheck, Sparkles, Activity, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { Reveal } from "@/components/Reveal";
import { SiteLayout } from "@/components/SiteLayout";

import heroFamily from "@/assets/hero-family.jpg";
import bubbleDad from "@/assets/bubble-dad.jpg";
import bubbleMom from "@/assets/bubble-mom.jpg";
import bubbleGrandma from "@/assets/bubble-grandma.jpg";
import bubbleGrandpa from "@/assets/bubble-grandpa.jpg";
import bubbleSon from "@/assets/bubble-son.jpg";
import refAsk from "@/assets/ask-plain-language.png.asset.json";
import refLifestyle from "@/assets/lifestyle-value-2.png.asset.json";
import refCheckin from "@/assets/ref-checkin.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedSafe — AI-powered health record for the whole family." },
      {
        name: "description",
        content:
          "MedSafe unifies every prescription, lab report and daily rhythm for your whole family — with clinical-grade AI that answers in plain language.",
      },
      { property: "og:title", content: "MedSafe — AI-powered family healthcare." },
      {
        property: "og:description",
        content:
          "One private timeline for your family's prescriptions, labs and lifestyle — grounded in your own reports.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <SiteLayout>
      <div className="bg-background text-foreground">
        <Hero />
        <Marquee />
        <PersonaVoices />
        <FeatureBreakdown />
        <FamilySection />
        <FoundersSection />
        <FinalCTA />
      </div>
    </SiteLayout>
  );
}

/* ─────────────────────  hero  ───────────────────── */

const HERO_CLIPS = [
  { img: bubbleGrandma, caption: "Is Grandma recovering from her surgery OK?" },
  { img: bubbleGrandpa, caption: "What happened at Grandpa's last visit?" },
  { img: bubbleDad, caption: "Is Dad's meal plan affecting his BP?" },
  { img: bubbleMom, caption: "Am I eating the right foods for PCOS?" },
  { img: bubbleSon, caption: "Is my son's vaccination schedule up to date?" },
];

function useAuthed() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s?.user));
    return () => sub.subscription.unsubscribe();
  }, []);
  return authed;
}

function PrimaryCTA({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const authed = useAuthed();
  function onClick() {
    if (!authed) return navigate({ to: "/auth" });
    navigate({ to: "/start" });
  }
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-2.5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:scale-[1.02] ${className}`}
    >
      <Sparkles className="h-4 w-4" />
      {authed ? "Open your timeline" : "Get started — it's free"}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function Hero() {
  const authed = useAuthed();
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src={heroFamily}
          alt=""
          className="h-full w-full object-cover"
          width={1920}
          height={1200}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklch, var(--primary) 55%, transparent) 0%, color-mix(in oklch, var(--primary) 20%, transparent) 45%, color-mix(in oklch, var(--background) 40%, transparent) 78%, var(--background) 100%)",
          }}
        />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 pb-28 pt-20 text-center sm:pt-24 md:pb-36 md:pt-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white backdrop-blur">
          <Sparkles className="h-3 w-3" /> AI-powered · Secure platform · Whole-family healthcare
        </div>
        <h1
          className="font-serif text-white"
          style={{
            fontSize: "clamp(2.4rem, 5.6vw, 4.8rem)",
            lineHeight: 1.03,
            letterSpacing: "-0.02em",
            textShadow: "0 2px 24px rgba(0,0,0,0.35)",
          }}
        >
          When your whole family relies on you,
          <br />
          <span className="italic">rely on MedSafe.</span>
        </h1>
        <p
          className="max-w-2xl text-base leading-relaxed text-white/95 sm:text-lg"
          style={{ textShadow: "0 1px 12px rgba(0,0,0,0.4)" }}
        >
          One private, AI-powered health record for every prescription, lab report and daily
          rhythm — grounded in what's actually happening with your family.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <PrimaryCTA />
          {!authed && (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
            >
              Log in
            </Link>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-white/90">
          <HeroChip>Secure platform</HeroChip>
          <HeroChip>DPDP-aligned</HeroChip>
          <HeroChip>Physician-led</HeroChip>
          <HeroChip>End-to-end encrypted</HeroChip>
        </div>
      </div>
    </section>
  );
}

function HeroChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-2.5 py-1 backdrop-blur">
      <ShieldCheck className="h-3 w-3" /> {children}
    </span>
  );
}

/* ─────────────────────  persona voices (moved below fold)  ───────────────────── */

function PersonaVoices() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HERO_CLIPS.length), 3800);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Real questions, real families
            </div>
            <h2
              className="mt-3 font-serif text-foreground"
              style={{ fontSize: "clamp(1.9rem, 3.8vw, 2.8rem)", lineHeight: 1.08, letterSpacing: "-0.02em" }}
            >
              The things you already worry about — answered from your own records.
            </h2>
          </div>
        </Reveal>

        <div className="relative mt-14 h-[360px] sm:h-[420px]">
          {HERO_CLIPS.map((c, i) => {
            const isActive = i === idx;
            return (
              <div
                key={i}
                className="absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out"
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
                }}
                aria-hidden={!isActive}
              >
                <div className="flex flex-col items-center gap-5">
                  <div className="h-40 w-40 overflow-hidden rounded-full ring-4 ring-primary/15 shadow-2xl sm:h-56 sm:w-56">
                    <img src={c.img} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="max-w-md rounded-2xl bg-card px-5 py-3 text-center font-serif text-lg text-foreground shadow-xl ring-1 ring-border/60 sm:text-xl">
                    “{c.caption}”
                  </div>
                </div>
              </div>
            );
          })}
          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5">
            {HERO_CLIPS.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === idx ? 22 : 6,
                  background: i === idx ? "var(--primary)" : "color-mix(in oklch, var(--primary) 25%, transparent)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────  luffu-style marquee  ───────────────────── */

function Marquee() {
  const items = [
    "AI-powered family healthcare",
    "Grounded in your own reports",
    "Clinical-grade timeline",
    "20-second daily check-in",
    "End-to-end encrypted",
    "DPDP-aligned",
    "Kids · Parents · You",
  ];
  return (
    <div className="border-y border-border bg-secondary/40 py-4 overflow-hidden">
      <div
        className="flex gap-10 whitespace-nowrap font-serif text-2xl italic text-primary sm:text-3xl"
        style={{ animation: "marquee 30s linear infinite" }}
      >
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="inline-flex items-center gap-10">
            {t}
            <span className="text-muted-foreground">✦</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-33.333%) } }`}</style>
    </div>
  );
}

/* ─────────────────────  feature breakdown  ───────────────────── */

const FEATURES = [
  {
    eyebrow: "Ask, in plain language",
    title: "Answers grounded in your own records.",
    body: "Ask about a lab trend, a diet, or which meds you're on. MedSafe cites the exact report and value — so every answer is auditable, never a guess.",
    icon: Sparkles,
    image: refAsk.url,
  },
  {
    eyebrow: "Lifestyle, quietly logged",
    title: "20 seconds a day. Zero friction.",
    body: "Type or hold the mic. A photo of a meal turns into a rough calorie estimate. Your rhythm builds itself — sleep, movement, meals, mood.",
    icon: Activity,
    image: refLifestyle.url,
    imageSecondary: refCheckin.url,
  },
  {
    eyebrow: "Kids · Parents · You",
    title: "One shared record for the whole family.",
    body: "Switch between profiles in a tap. Vaccination schedules, follow-ups and flagged values stay where the right caregiver can see them.",
    icon: Users,
    image: bubbleSon,
    imageSecondary: bubbleGrandma,
  },
  {
    eyebrow: "Clinical Timeline",
    title: "Every visit, in one clean thread.",
    body: "Prescriptions, labs and imaging within a 10-day window are linked to the same visit with the right doctor attached. No more folders.",
    icon: HeartPulse,
    image: bubbleDad,
  },
] as const;

function FeatureBreakdown() {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              What MedSafe does
            </div>
            <h2
              className="mt-3 font-serif text-foreground"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.06, letterSpacing: "-0.02em" }}
            >
              Clinical AI. Personalized care. One timeline.
            </h2>
          </div>
        </Reveal>

        <div className="mt-16 space-y-24 sm:space-y-28">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title}>
                <div
                  className={`grid items-center gap-10 md:grid-cols-2 md:gap-16 ${
                    i % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""
                  }`}
                >
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      <Icon className="h-3.5 w-3.5" /> {f.eyebrow}
                    </div>
                    <h3
                      className="mt-4 font-serif text-foreground"
                      style={{ fontSize: "clamp(1.7rem, 3vw, 2.4rem)", lineHeight: 1.1, letterSpacing: "-0.02em" }}
                    >
                      {f.title}
                    </h3>
                    <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                      {f.body}
                    </p>
                  </div>
                  <FeatureVisual image={f.image} secondary={(f as any).imageSecondary} />
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureVisual({ image, secondary }: { image: string; secondary?: string }) {
  return (
    <div className="relative aspect-[4/3] w-full">
      <div
        className="absolute inset-0 rounded-3xl bg-accent/60"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklch, var(--primary) 8%, var(--background)), color-mix(in oklch, var(--accent) 60%, var(--background)))",
        }}
      />
      <div className="absolute inset-4 overflow-hidden rounded-2xl bg-white shadow-2xl shadow-primary/15">
        <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>
      {secondary && (
        <div className="absolute -bottom-6 -right-4 h-40 w-32 overflow-hidden rounded-2xl bg-white shadow-2xl shadow-primary/20 ring-4 ring-background sm:h-52 sm:w-40">
          <img src={secondary} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────  family band  ───────────────────── */

function FamilySection() {
  return (
    <section className="bg-secondary/50 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <Reveal>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            For the caregivers who do it all
          </div>
          <h2
            className="mt-3 font-serif text-foreground"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.06, letterSpacing: "-0.02em" }}
          >
            Kids. Parents. You.
            <br />
            <span className="italic">One shared record.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            MedSafe learns your family's rhythms and stays on top of who-needs-what-when, so you
            can focus on caring.
          </p>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-10 flex items-center justify-center -space-x-3">
            {[bubbleGrandpa, bubbleGrandma, bubbleDad, bubbleMom, bubbleSon].map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="h-14 w-14 rounded-full object-cover ring-4 ring-background shadow-md"
                loading="lazy"
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────  founders  ───────────────────── */

const FOUNDERS = [
  {
    name: "Dr. Jit Sarkar",
    role: "Co-founder · R&D",
    creds: "MBBS, PhD",
    quote:
      "I've watched families juggle five different clinics and a folder of scans. MedSafe is the record we wished existed — one that quietly does the remembering, so clinicians can see the full picture.",
  },
  {
    name: "Dipankar Mandal",
    role: "Co-founder · Strategy & Ops",
    creds: "Eng. Mgmt., Uni. of York · MS Financial Engg., WorldQuant Univ.",
    quote:
      "We built MedSafe for our own parents first. Every recommendation is grounded in your own reports and lifestyle logs. Nothing is invented, nothing leaves your family's circle without your consent.",
  },
];

function FoundersSection() {
  return (
    <section className="bg-primary text-primary-foreground py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
              Founders
            </div>
            <h2
              className="mt-3 font-serif"
              style={{ fontSize: "clamp(1.9rem, 3.6vw, 2.75rem)", lineHeight: 1.1, letterSpacing: "-0.02em" }}
            >
              Science-backed. Clinician-led.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Not a generic health app — built by a physician-scientist and a healthtech operator
              with academic ties to King's College London.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {FOUNDERS.map((f, i) => (
            <Reveal key={f.name} delay={i * 120}>
              <div className="h-full rounded-3xl bg-primary-foreground/5 p-8 ring-1 ring-primary-foreground/15 backdrop-blur">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-foreground/10 font-serif text-lg">
                    {f.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="font-serif text-xl">{f.name}</div>
                    <div className="text-xs uppercase tracking-wider text-primary-foreground/70">
                      {f.role}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-primary-foreground/60">{f.creds}</div>
                <p className="mt-5 text-[15px] leading-relaxed text-primary-foreground/90">
                  “{f.quote}”
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs text-primary-foreground/80">
            <TrustChip>DPDP-aligned</TrustChip>
            <TrustChip>Physician-led only</TrustChip>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function TrustChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/25 bg-primary-foreground/5 px-3 py-1">
      <ShieldCheck className="h-3 w-3" /> {children}
    </span>
  );
}

/* ─────────────────────  final CTA  ───────────────────── */

function FinalCTA() {
  const authed = useAuthed();
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <Reveal>
          <h2
            className="font-serif text-foreground"
            style={{ fontSize: "clamp(2rem, 4.2vw, 3.25rem)", lineHeight: 1.08, letterSpacing: "-0.02em" }}
          >
            Your family's health,
            <br />
            <span className="italic text-primary">quietly organized.</span>
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <PrimaryCTA />
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent"
            >
              Log in
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
