import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, HeartPulse, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveMember } from "@/lib/active-member";
import { Reveal } from "@/components/Reveal";

import heroFamily from "@/assets/hero-family.jpg";
import bubbleDad from "@/assets/bubble-dad.jpg";
import bubbleMom from "@/assets/bubble-mom.jpg";
import bubbleGrandma from "@/assets/bubble-grandma.jpg";
import bubbleGrandpa from "@/assets/bubble-grandpa.jpg";
import bubbleSon from "@/assets/bubble-son.jpg";
import bubbleDog from "@/assets/bubble-dog.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedSafe — When your whole family relies on you, rely on MedSafe." },
      {
        name: "description",
        content:
          "MedSafe quietly watches over your family's health — every prescription, lab report and daily rhythm in one clean clinical timeline, with AI that answers in plain language.",
      },
      { property: "og:title", content: "MedSafe — Your family's health, quietly organized." },
      {
        property: "og:description",
        content:
          "Every prescription, lab report and daily check-in for your whole family — grounded, private, and ready when you need it.",
      },
    ],
  }),
  component: Index,
});

/* ─────────────────────────  data  ───────────────────────── */

const HERO_CLIPS = [
  { img: bubbleGrandma, caption: "Is Grandma recovering from her surgery OK?" },
  { img: bubbleGrandpa, caption: "What happened at Grandpa's last doctor's visit?" },
  { img: bubbleDad, caption: "Is Dad's new meal plan affecting his blood pressure?" },
  { img: bubbleMom, caption: "Am I eating the right foods to manage PCOS?" },
  { img: bubbleSon, caption: "Is my son's vaccination schedule up to date?" },
  { img: bubbleDog, caption: "Did anyone give Bruno his morning medication?" },
];

const FEATURES = [
  {
    eyebrow: "Clinical Timeline",
    title: "Every visit, in one clean thread.",
    body: "Prescriptions, labs and imaging within a 10-day window are linked to the same visit, with the right doctor attached. No more folders, no more guessing.",
    accent: "kids",
  },
  {
    eyebrow: "Ask, in plain language",
    title: "Answers grounded in your own reports.",
    body: "Ask about a lab trend or a diet, and MedSafe cites the exact report and value — so every answer is auditable, not a guess.",
    accent: "parents",
  },
  {
    eyebrow: "Lifestyle, quietly logged",
    title: "20 seconds a day. Zero friction.",
    body: "Type or hold the mic. Photos of a meal turn into a rough calorie estimate. Your rhythm builds itself — sleep, movement, meals, mood.",
    accent: "me",
  },
  {
    eyebrow: "Whole-family view",
    title: "Kids. Parents. You. One shared record.",
    body: "Switch between profiles in a tap. Flagged values, upcoming follow-ups and consent trails stay where each person can see them.",
    accent: "kids",
  },
] as const;

/* ─────────────────────────  page  ───────────────────────── */

function Index() {
  return (
    <div className="min-h-screen bg-[#f5f1ea] text-[#1a1613]">
      <Hero />
      <CaregiversSection />
      <FeatureBreakdown />
      <FounderStory />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ─────────────────────────  hero  ───────────────────────── */

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <Link
          to="/"
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-2xl bg-white/95 text-[#1a1613] shadow-sm backdrop-blur"
          aria-label="MedSafe home"
        >
          <HeartPulse className="h-5 w-5" strokeWidth={2.2} />
        </Link>

        <div className="pointer-events-auto hidden items-center gap-2 rounded-full bg-white/95 p-1 pl-2 shadow-sm backdrop-blur sm:flex">
          <Link to="/care" className="rounded-full px-4 py-2 text-sm font-medium text-[#1a1613] hover:bg-black/5">
            About
          </Link>
          <Link to="/services" className="rounded-full px-4 py-2 text-sm font-medium text-[#1a1613] hover:bg-black/5">
            How it works
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1613] px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02]"
          >
            Join the Waitlist
          </Link>
        </div>

        <button
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-2xl bg-white/95 text-[#1a1613] shadow-sm backdrop-blur sm:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="pointer-events-auto mx-5 mt-2 rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur sm:hidden">
          <Link to="/care" className="block rounded-lg px-3 py-2 text-sm">About</Link>
          <Link to="/services" className="block rounded-lg px-3 py-2 text-sm">How it works</Link>
          <Link to="/auth" className="mt-1 block rounded-lg bg-[#1a1613] px-3 py-2 text-center text-sm font-semibold text-white">
            Join the Waitlist
          </Link>
        </div>
      )}
    </header>
  );
}

function Hero() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HERO_CLIPS.length), 4200);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative isolate min-h-[92vh] w-full overflow-hidden bg-[#1a1613]">
      <img
        src={heroFamily}
        alt="A multi-generational family in the garden at golden hour"
        className="absolute inset-0 h-full w-full object-cover"
        width={1920}
        height={1200}
      />
      {/* subtle darken so headline reads */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.10) 30%, rgba(0,0,0,0.05) 55%, rgba(245,241,234,0.15) 82%, rgba(245,241,234,0.55) 100%)",
        }}
      />

      <Nav />

      <div className="relative z-10 mx-auto flex max-w-[1400px] flex-col justify-between px-5 pb-[16vh] pt-32 sm:px-8 sm:pt-36 lg:min-h-[92vh]">
        {/* Headline block */}
        <div className="max-w-2xl">
          <h1
            className="font-display text-white"
            style={{
              fontSize: "clamp(2.6rem, 6.2vw, 5.5rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              textShadow: "0 2px 20px rgba(0,0,0,0.25)",
            }}
          >
            When the whole family relies on you,
            <br />
            <span className="italic text-white/95">rely on MedSafe.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/90 sm:text-lg" style={{ textShadow: "0 1px 12px rgba(0,0,0,0.35)" }}>
            MedSafe ("med-safe") is the quiet companion that watches over your family's health records
            and daily rhythms — so every recommendation is grounded in what's actually happening.
          </p>
          <div className="mt-8">
            <Link
              to="/auth"
              className="group inline-flex items-center gap-3 rounded-full bg-white pl-4 pr-5 py-3 text-sm font-semibold text-[#1a1613] shadow-lg transition hover:scale-[1.02]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#8b2a1a]" />
              Join the waitlist
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Right side: cycling thumbnails with captions */}
        <div className="pointer-events-none absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-end gap-4 sm:right-8 md:flex">
          {HERO_CLIPS.map((c, i) => {
            const active = i === idx;
            const size = 56 + ((i * 7) % 24); // 56 – 78
            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-[#1a1613] shadow-md backdrop-blur transition-all duration-700 ${
                    active ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                  }`}
                  style={{ maxWidth: 240 }}
                >
                  {c.caption}
                </div>
                <div
                  className="relative overflow-hidden rounded-full ring-2 ring-white/70 shadow-lg transition-all duration-700"
                  style={{
                    width: size,
                    height: size,
                    transform: active ? "scale(1.08)" : "scale(1)",
                  }}
                >
                  <img
                    src={c.img}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    width={640}
                    height={640}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Oversized wordmark bleeding off bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 select-none overflow-hidden">
          <div
            className="font-display leading-[0.82] text-white/85 mix-blend-overlay"
            style={{
              fontSize: "clamp(9rem, 26vw, 26rem)",
              letterSpacing: "-0.04em",
              transform: "translateY(28%)",
              textAlign: "center",
            }}
          >
            MedSafe
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="relative z-10 mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 px-5 pb-6 sm:px-8">
        <TrustPill>End-to-end encrypted</TrustPill>
        <TrustPill>NABL-accredited labs</TrustPill>
        <TrustPill>Reviewed by MD physicians</TrustPill>
        <TrustPill>DPDP-aligned</TrustPill>
      </div>
    </section>
  );
}

function TrustPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
      <ShieldCheck className="h-3 w-3" /> {children}
    </span>
  );
}

/* ─────────────────────  caregivers section  ───────────────────── */

type Bubble = {
  img: string;
  caption: string;
  x: string; // left %
  y: string; // top %
  size: number; // px
  side: "left" | "right";
};

const BUBBLES: Bubble[] = [
  { img: bubbleDad,     caption: "Is Dad's new meal plan affecting his BP?",       x: "34%", y: "6%",  size: 96,  side: "left"  },
  { img: bubbleMom,     caption: "Am I eating the right foods to manage PCOS?",    x: "62%", y: "10%", size: 108, side: "right" },
  { img: bubbleGrandpa, caption: "What happened at Grandpa's last visit?",         x: "22%", y: "24%", size: 84,  side: "left"  },
  { img: bubbleSon,     caption: "Did Rohan take his morning medication?",         x: "76%", y: "30%", size: 92,  side: "right" },
  { img: bubbleGrandma, caption: "Is Grandma recovering from her surgery OK?",     x: "12%", y: "58%", size: 112, side: "left"  },
  { img: bubbleDog,     caption: "Bruno's tick medicine is due next week.",        x: "82%", y: "60%", size: 100, side: "right" },
];

function CaregiversSection() {
  return (
    <section className="relative bg-[#f5f1ea] py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0">
        {BUBBLES.map((b, i) => (
          <FloatingBubble key={i} bubble={b} delay={i * 120} />
        ))}
      </div>

      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <Reveal>
          <h2
            className="font-display text-[#1a1613]"
            style={{ fontSize: "clamp(2.2rem, 4.4vw, 3.75rem)", lineHeight: 1.06, letterSpacing: "-0.02em" }}
          >
            For the caregivers
            <br />
            who do it all
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-[#4a423d]">
            Your mind's brimming with questions, concerns, and an ever-changing list of
            who-needs-what-when. MedSafe learns your family's rhythms and stays on top of it all,
            so you can focus on caring.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function FloatingBubble({ bubble, delay }: { bubble: Bubble; delay: number }) {
  return (
    <div
      className="pointer-events-auto absolute hidden md:block"
      style={{ left: bubble.x, top: bubble.y }}
    >
      <Reveal delay={delay}>
        <div className={`flex items-center gap-3 ${bubble.side === "right" ? "flex-row-reverse" : ""}`}>
          <div
            className="overflow-hidden rounded-full ring-1 ring-black/5 shadow-xl"
            style={{
              width: bubble.size,
              height: bubble.size,
              animation: `bubble-drift ${8 + (bubble.size % 5)}s ease-in-out ${delay}ms infinite alternate`,
            }}
          >
            <img src={bubble.img} alt="" className="h-full w-full object-cover" loading="lazy" width={640} height={640} />
          </div>
          <div className="max-w-[220px] rounded-2xl bg-white/95 px-3 py-1.5 text-xs font-medium text-[#1a1613] shadow-md">
            {bubble.caption}
          </div>
        </div>
      </Reveal>
      <style>{`
        @keyframes bubble-drift {
          0%   { transform: translate(0, 0); }
          100% { transform: translate(0, -14px); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────  feature breakdown  ───────────────────── */

function FeatureBreakdown() {
  return (
    <section className="bg-[#efe9df] py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="space-y-24 sm:space-y-32">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title}>
              <div
                className={`grid items-center gap-12 md:grid-cols-2 ${
                  i % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <div
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b2a1a]"
                  >
                    {f.eyebrow}
                  </div>
                  <h3
                    className="mt-3 font-display text-[#1a1613]"
                    style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.75rem)", lineHeight: 1.1, letterSpacing: "-0.02em" }}
                  >
                    {f.title}
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-[#4a423d]">{f.body}</p>
                </div>
                <FeatureMockup index={i} accent={f.accent} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureMockup({ index, accent }: { index: number; accent: "kids" | "parents" | "me" }) {
  const accentBg =
    accent === "kids" ? "#f0e5c8" : accent === "parents" ? "#f0d4c1" : "#d9dfec";
  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl shadow-black/10"
      style={{ background: accentBg }}
    >
      {/* Simulated app UI card */}
      <div className="absolute inset-6 rounded-2xl bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#8b2a1a] text-white">
              <HeartPulse className="h-4 w-4" />
            </div>
            <div className="text-sm font-semibold text-[#1a1613]">MedSafe · Timeline</div>
          </div>
          <div className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#4a423d]">
            Preview
          </div>
        </div>
        <div className="mt-4 space-y-2.5">
          {[
            { name: "HbA1c", value: "6.4%", tone: "bad", ref: "Ref 4.0–5.6%" },
            { name: "LDL Cholesterol", value: "118", tone: "warn", ref: "Ref <100 mg/dL" },
            { name: "Vitamin D", value: "42", tone: "good", ref: "Ref 30–100 ng/mL" },
            { name: "TSH", value: "2.1", tone: "good", ref: "Ref 0.4–4.0 mIU/L" },
          ].slice(0, 3 + (index % 2)).map((r) => (
            <div key={r.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl bg-[#faf7f2] px-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{r.name}</div>
                <div className="truncate text-[11px] text-[#7a6f68]">{r.ref}</div>
              </div>
              <div className="text-right text-sm font-semibold tabular-nums">{r.value}</div>
              <span
                className={
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                  (r.tone === "bad"
                    ? "bg-[#8b2a1a]/15 text-[#8b2a1a]"
                    : r.tone === "warn"
                    ? "bg-amber-500/15 text-amber-700"
                    : "bg-emerald-500/15 text-emerald-700")
                }
              >
                {r.tone === "bad" ? "out" : r.tone === "warn" ? "watch" : "ok"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────  founder story  ───────────────────── */

function FounderStory() {
  return (
    <section className="bg-[#1a1613] py-24 text-[#f5f1ea] sm:py-32">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <Reveal>
          <div className="mx-auto flex w-fit items-center gap-2">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#8b2a1a] shadow-lg">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <h2
            className="mt-6 font-display"
            style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", lineHeight: 1.15, letterSpacing: "-0.02em" }}
          >
            We built MedSafe for our own families first.
          </h2>
        </Reveal>
        <Reveal delay={180}>
          <p className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-[#d6cec6]">
            After watching our parents juggle five different clinics, a folder of scans and a
            WhatsApp group of prescriptions, we knew there had to be a calmer way. MedSafe is the
            record we wished existed — one that quietly does the remembering, so families can just
            be together.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <p className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-[#d6cec6]">
            Every recommendation is grounded in your own reports and lifestyle logs. Nothing is
            invented. Nothing leaves your family's circle without your consent.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <p className="mt-8 font-display text-lg text-[#f5f1ea]">
            — The MedSafe team, Kolkata
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────  final cta  ───────────────────── */

function FinalCTA() {
  const navigate = useNavigate();
  const { members, setActiveId } = useActiveMember();
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  function onCta() {
    if (!authed) return navigate({ to: "/auth" });
    const def = members.find((m) => m.is_default) || members[0];
    if (def) setActiveId(def.id);
    navigate({ to: "/dashboard" });
  }

  return (
    <section className="bg-[#f5f1ea] py-24 sm:py-32">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <Reveal>
          <h2
            className="font-display text-[#1a1613]"
            style={{ fontSize: "clamp(2.2rem, 4.4vw, 3.5rem)", lineHeight: 1.08, letterSpacing: "-0.02em" }}
          >
            Your family's health,
            <br /> <span className="italic">quietly organized.</span>
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <button
            onClick={onCta}
            className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#1a1613] pl-4 pr-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#e8b84a]" />
            {authed ? "Open your timeline" : "Join the waitlist"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-10 flex items-center justify-center -space-x-3">
            {[bubbleDad, bubbleMom, bubbleGrandpa, bubbleGrandma, bubbleSon, bubbleDog].map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="h-11 w-11 rounded-full object-cover ring-3 ring-[#f5f1ea]"
                style={{ borderWidth: 3 }}
                loading="lazy"
                width={640}
                height={640}
              />
            ))}
            <div className="ml-4 text-sm text-[#4a423d]">Families already on the list</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────  footer  ───────────────────── */

function Footer() {
  return (
    <footer className="border-t border-black/10 bg-[#f5f1ea] py-10">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 text-sm text-[#4a423d]">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#1a1613] text-white">
            <HeartPulse className="h-4 w-4" />
          </div>
          <span className="font-display text-lg text-[#1a1613]">MedSafe</span>
        </div>
        <div className="flex items-center gap-5 text-xs">
          <Link to="/privacy" className="hover:text-[#1a1613]">Privacy</Link>
          <Link to="/dpdp-notice" className="hover:text-[#1a1613]">DPDP Notice</Link>
          <Link to="/care" className="hover:text-[#1a1613]">Contact</Link>
        </div>
        <div className="text-xs">© {new Date().getFullYear()} MedSafe · A DeRiskBio initiative</div>
      </div>
    </footer>
  );
}
