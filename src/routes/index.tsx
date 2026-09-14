import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, ArrowRight, Check, FileText, HeartPulse, ShieldCheck, Stethoscope, Syringe, Users } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import heroFamily from "@/assets/hero-family.jpg";
import bubbleGrandma from "@/assets/bubble-grandma.jpg";
import bubbleSon from "@/assets/bubble-son.jpg";
import refAsk from "@/assets/ask-plain-language.png.asset.json";
import refLifestyle from "@/assets/lifestyle-value-2.png.asset.json";
import refCheckin from "@/assets/ref-checkin.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedSafe | Family Health Records, Made Clear" },
      { name: "description", content: "Organise family prescriptions, reports, lab trends and daily health logs in one private timeline with report-grounded MedBuddy answers." },
      { property: "og:title", content: "MedSafe | Stay informed about your family’s health" },
      { property: "og:description", content: "Private family records, clear clinical trends and AI answers grounded in your own reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://med-safe.live/" }],
  }),
  component: Index,
});

function useAuthed() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(Boolean(data.user)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setAuthed(Boolean(session?.user)));
    return () => sub.subscription.unsubscribe();
  }, []);
  return authed;
}

function PrimaryAction() {
  const navigate = useNavigate();
  const authed = useAuthed();
  return (
    <Button size="lg" className="h-12 rounded-lg px-6" onClick={() => navigate({ to: authed ? "/start" : "/auth" })}>
      {authed ? "Open your timeline" : "Get started"}<ArrowRight className="h-4 w-4" />
    </Button>
  );
}

function Index() {
  return (
    <SiteLayout>
      <Hero />
      <ProofStrip />
      <FeatureStories />
      <FamilyCare />
      <FinalAction />
    </SiteLayout>
  );
}

function Hero() {
  return (
    <section className="ambient-health-bg relative isolate min-h-[720px] overflow-hidden border-b border-border sm:min-h-[790px]">
      <div aria-hidden className="absolute left-[10%] top-[22%] h-9 w-9 animate-pulse rounded-full bg-secondary text-center text-2xl font-bold text-primary/25">+</div>
      <div aria-hidden className="absolute right-[18%] top-[18%] h-8 w-8 rotate-12 rounded-lg bg-accent/30" />
      <div aria-hidden className="absolute right-[-8%] top-[38%] h-40 w-80 rounded-full border-2 border-accent/35" />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-0 pt-20 text-center sm:pt-24">
        <Reveal>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="rounded bg-accent px-2 py-0.5 text-accent-foreground">Now</span> Built for families who manage care together</div>
          <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-semibold leading-[1.03] text-foreground sm:text-7xl">
            Manage family health.<br />Stay <span className="text-accent-foreground underline decoration-accent decoration-4 underline-offset-8">informed.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">Every report, prescription and daily health signal in one secure place—for clearer conversations and calmer care.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><PrimaryAction /><Button asChild variant="outline" size="lg" className="h-12 rounded-lg"><Link to="/about">Why MedSafe</Link></Button></div>
        </Reveal>

        <Reveal delay={120} className="relative mt-16 w-full max-w-5xl">
          <div className="absolute left-0 top-20 hidden w-64 rounded-xl border border-border bg-card p-4 text-left shadow-xl lg:block">
            <div className="flex items-center justify-between text-xs"><span className="font-semibold">HbA1c trend</span><span className="rounded bg-accent px-2 py-0.5 font-bold">Improving</span></div>
            <div className="mt-5 flex h-24 items-end gap-2">{[45, 72, 58, 88, 76, 95].map((h, i) => <span key={i} className="flex-1 rounded-t bg-secondary" style={{ height: `${h}%` }} />)}</div>
            <div className="mt-2 text-right text-2xl font-semibold">6.1%</div>
          </div>

          <div className="relative mx-auto h-[390px] w-[250px] overflow-hidden rounded-t-[42px] border-[7px] border-foreground bg-card shadow-2xl sm:h-[430px] sm:w-[280px]">
            <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-foreground" />
            <div className="p-5 text-left">
              <div className="flex items-center gap-2"><img src={bubbleSon} alt="Family profile" className="h-10 w-10 rounded-full object-cover" /><div><div className="text-xs text-muted-foreground">Good afternoon</div><div className="font-semibold">Your family overview</div></div></div>
              <h2 className="mt-7 text-3xl font-semibold leading-tight">What needs your attention today?</h2>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px]">{["All", "Parents", "Kids"].map((x, i) => <div key={x} className={`rounded-full px-2 py-2 ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{x}</div>)}</div>
              <div className="mt-6 rounded-xl bg-secondary p-4"><div className="text-xs font-semibold">Latest report</div><div className="mt-2 text-xl font-semibold">2 flagged values</div><div className="mt-3 h-2 overflow-hidden rounded-full bg-card"><div className="h-full w-3/4 rounded-full bg-accent" /></div></div>
            </div>
          </div>

          <div className="absolute right-0 top-10 hidden w-64 rounded-xl border border-accent/50 bg-accent/30 p-4 text-left shadow-xl lg:block">
            <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-card"><HeartPulse className="h-5 w-5" /></span><div><div className="text-xs text-muted-foreground">MedBuddy found</div><div className="font-semibold">Report-grounded answer</div></div></div>
            <p className="mt-4 text-xs leading-relaxed">“The change is visible across your last three reports. Tap to see the exact source values.”</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ProofStrip() {
  return <section className="relative z-10 -mt-1 border-y border-border bg-card"><div className="mx-auto grid max-w-6xl divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">{[
    [ShieldCheck, "Private by design", "DPDP-aligned"], [Stethoscope, "Physician-led", "Built around clinical context"], [Users, "One family", "Kids · Parents · You"],
  ].map(([Icon, title, body]) => { const C = Icon as typeof ShieldCheck; return <div key={String(title)} className="flex items-center gap-4 px-6 py-5"><span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary"><C className="h-5 w-5 text-primary" /></span><div><div className="font-semibold">{String(title)}</div><div className="text-xs text-muted-foreground">{String(body)}</div></div></div>; })}</div></section>;
}

const stories = [
  { kicker: "Ask MedBuddy", title: "See the evidence, not just an answer.", body: "MedBuddy searches the selected family member’s records, finds the relevant passages and shows which report supports the explanation.", image: refAsk.url, tags: ["Source-linked", "Private retrieval", "Clear language"], icon: FileText },
  { kicker: "Daily rhythm", title: "A check-in that fits real life.", body: "Speak, type or photograph a meal. Sleep, movement, mood and meals become a simple timeline without turning wellbeing into paperwork.", image: refLifestyle.url, second: refCheckin.url, tags: ["Voice notes", "Meal photos", "Gentle reminders"], icon: Activity },
];

function FeatureStories() {
  return <section className="bg-background py-24 sm:py-32"><div className="mx-auto max-w-6xl px-4"><Reveal><div className="max-w-3xl"><div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Designed for clarity</div><h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">Your family’s health,<br />made easier to read.</h2></div></Reveal><div className="mt-20 space-y-24">{stories.map((story, index) => <Reveal key={story.title}><article className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-20 ${index % 2 ? "lg:[&>div:first-child]:order-2" : ""}`}><div><div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary"><story.icon className="h-4 w-4" />{story.kicker}</div><h3 className="mt-5 text-3xl font-semibold leading-tight sm:text-5xl">{story.title}</h3><p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">{story.body}</p><ul className="mt-7 grid gap-3 sm:grid-cols-3">{story.tags.map(tag => <li key={tag} className="flex items-center gap-2 text-sm font-semibold"><Check className="h-4 w-4 text-accent-foreground" />{tag}</li>)}</ul></div><div className="relative min-h-[360px] overflow-hidden rounded-xl bg-secondary p-6 sm:min-h-[440px]"><div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_center,var(--border)_1px,transparent_1px)] [background-size:20px_20px]" />{story.second ? <><img src={story.image} alt="Lifestyle dashboard" className="absolute left-[8%] top-[12%] w-[48%] rounded-lg shadow-xl" loading="lazy" /><img src={story.second} alt="Daily check-in screen" className="absolute bottom-[8%] right-[8%] w-[48%] rounded-lg shadow-xl" loading="lazy" /></> : <img src={story.image} alt="MedBuddy report answer" className="relative mx-auto mt-8 w-[86%] rounded-lg shadow-xl" loading="lazy" />}</div></article></Reveal>)}</div></div></section>;
}

function FamilyCare() {
  return <section className="bg-primary py-24 text-primary-foreground"><div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2"><Reveal><div className="relative h-[440px]"><img src={heroFamily} alt="Indian family together" className="h-full w-full rounded-xl object-cover" loading="lazy" /><img src={bubbleGrandma} alt="Older family member profile" className="absolute -bottom-6 right-6 h-28 w-28 rounded-full border-8 border-primary object-cover" loading="lazy" /></div></Reveal><Reveal delay={100}><div className="text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground/65">Care travels across generations</div><h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">One calm view for everyone you care for.</h2><p className="mt-5 text-primary-foreground/75">Switch between your own record, parents and children. Keep vaccination certificates, prescriptions, visits and flagged values with the right person.</p><div className="mt-8 grid gap-3">{[[Users,"Parents and caregivers"],[Syringe,"Children’s vaccinations"],[HeartPulse,"Your own long-term trends"]].map(([I,t]) => { const Icon=I as typeof Users; return <div key={String(t)} className="flex items-center gap-3 border-t border-primary-foreground/20 py-4"><Icon className="h-5 w-5" /><span className="font-semibold">{String(t)}</span></div>; })}</div></Reveal></div></section>;
}

function FinalAction() {
  return <section className="ambient-health-bg py-24"><div className="mx-auto max-w-3xl px-4 text-center"><Reveal><h2 className="text-4xl font-semibold sm:text-6xl">Stay informed.<br />Care with confidence.</h2><p className="mx-auto mt-5 max-w-xl text-muted-foreground">Start with one report. MedSafe will help you build the family health timeline from there.</p><div className="mt-8"><PrimaryAction /></div></Reveal></div></section>;
}