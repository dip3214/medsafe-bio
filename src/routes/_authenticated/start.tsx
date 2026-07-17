import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { useActiveMember, type Segment } from "@/lib/active-member";
import { Baby, Users, User, ArrowRight, Syringe, HeartPulse, Sparkles } from "lucide-react";
import { Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/_authenticated/start")({
  head: () => ({
    meta: [
      { title: "Choose a segment — MedSafe" },
      { name: "description", content: "Pick who you're caring for right now — MedSafe Me, Parents, or Kids." },
    ],
  }),
  component: SegmentLanding,
});

const CARDS: {
  key: Segment;
  label: string;
  tagline: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  bullets: string[];
}[] = [
  {
    key: "me",
    label: "MedSafe Me",
    tagline: "Your own timeline",
    body: "Every prescription, lab and daily rhythm — for you, in one place.",
    icon: User,
    tone: "bg-me text-me-foreground",
    bullets: ["Lifestyle check-ins", "Trend charts", "Ask anything"],
  },
  {
    key: "parents",
    label: "MedSafe Parents",
    tagline: "Mum · Dad · in-laws",
    body: "Track visits, meds and follow-ups for the people who raised you.",
    icon: Users,
    tone: "bg-parents text-parents-foreground",
    bullets: ["Visit-to-visit summary", "Refill reminders", "Doctor notes"],
  },
  {
    key: "kids",
    label: "MedSafe Kids",
    tagline: "Vaccines · Growth · Care",
    body: "Immunisation schedule, growth charts and paediatric visits — always at hand.",
    icon: Baby,
    tone: "bg-kids text-kids-foreground",
    bullets: ["Vaccination schedule", "Growth tracking", "Allergies & alerts"],
  },
];

function SegmentLanding() {
  const { members, setActiveId } = useActiveMember();
  const navigate = useNavigate();

  const firstOf = (seg: Segment) =>
    members.find((m) => m.segment === seg && m.is_default) || members.find((m) => m.segment === seg);

  function open(seg: Segment) {
    const m = firstOf(seg);
    if (m) {
      setActiveId(m.id);
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/members" });
    }
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3 w-3" /> Welcome
            </div>
            <h1
              className="mt-4 font-serif text-foreground"
              style={{ fontSize: "clamp(2rem, 4.4vw, 3.25rem)", lineHeight: 1.06, letterSpacing: "-0.02em" }}
            >
              Who are we caring for today?
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Pick a segment to open the right timeline. You can switch anytime.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {CARDS.map((c, i) => {
            const Icon = c.icon;
            const has = !!firstOf(c.key);
            return (
              <Reveal key={c.key} delay={i * 100}>
                <button
                  onClick={() => open(c.key)}
                  className={`group relative flex h-full w-full flex-col rounded-3xl p-6 text-left shadow-sm ring-1 ring-border/50 transition hover:-translate-y-0.5 hover:shadow-xl ${c.tone}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-background/70 text-primary shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="font-serif text-2xl leading-tight">{c.label}</div>
                      <div className="text-xs opacity-75">{c.tagline}</div>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed opacity-90">{c.body}</p>
                  <ul className="mt-5 space-y-1.5 text-xs opacity-90">
                    {c.bullets.map((b) => (
                      <li key={b} className="inline-flex items-center gap-1.5">
                        {c.key === "kids" ? <Syringe className="h-3 w-3" /> : <HeartPulse className="h-3 w-3" />} {b}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold">
                    {has ? "Open" : "Add member"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-10 text-center text-xs text-muted-foreground">
          Need to add family?{" "}
          <Link to="/members" className="font-medium text-primary underline-offset-2 hover:underline">
            Manage members
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
