import { createFileRoute } from "@tanstack/react-router";
import { Bell, ClipboardList, HandHeart, HeartPulse, ShieldCheck, Stethoscope, Truck, Wallet } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/care")({
  head: () => ({ meta: [
    { title: "Upcoming MedSafe Care Features" },
    { name: "description", content: "Explore MedSafe’s upcoming caregiving, reminders, medicine delivery, specialist escalation and health spending tools." },
    { property: "og:title", content: "What MedSafe is building next" },
    { property: "og:description", content: "A transparent preview of upcoming family-care tools." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }), component: CarePage,
});

const roadmap = [
  { icon: Bell, title: "Smart reminders", body: "Fasting tests, follow-ups, vaccinations and refills timed around your day.", stage: "In design", progress: 72 },
  { icon: HandHeart, title: "Care-giving visits", body: "Routine vitals captured at home and attached to the correct family timeline.", stage: "Research", progress: 46 },
  { icon: HeartPulse, title: "Diabetes management", body: "Clinician-led HbA1c trends, adherence, diet logs and consultation notes.", stage: "Clinical review", progress: 58 },
  { icon: ClipboardList, title: "Structured clinical notes", body: "Observations and instructions stored against the right visit, not lost in chat threads.", stage: "Prototype", progress: 64 },
  { icon: Truck, title: "Medicines at doorstep", body: "Reorder from the latest prescription and deliver to a parent’s saved address.", stage: "Exploring partners", progress: 32 },
  { icon: Stethoscope, title: "Specialist escalation", body: "Critical flags reviewed through a safe clinical escalation pathway.", stage: "Clinical review", progress: 41 },
  { icon: Wallet, title: "Healthcare spending", body: "A clearer view of family medical expenses, renewals and upcoming costs.", stage: "Research", progress: 28 },
];

function CarePage() {
  return <SiteLayout><section className="ambient-health-bg overflow-hidden border-b border-border"><div className="mx-auto grid min-h-[440px] max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1fr_.8fr]"><Reveal><div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">MedSafe roadmap</div><h1 className="mt-5 text-5xl font-semibold leading-tight sm:text-7xl">Care that arrives before the reminder is forgotten.</h1><p className="mt-6 max-w-2xl text-lg text-muted-foreground">A transparent look at what we’re validating next. These tools are not live yet—we release them only when the experience and safeguards are ready.</p></Reveal><Reveal delay={100}><div className="relative mx-auto aspect-square max-w-sm"><div className="absolute inset-[12%] animate-pulse rounded-full border border-accent bg-accent/20" /><div className="absolute inset-[27%] rounded-full bg-primary" /><Bell className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-primary-foreground" />{["Tests","Refills","Visits","Vaccines"].map((x,i)=><span key={x} className="absolute rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold shadow-lg" style={{ left: `${i%2?68:2}%`, top: `${i<2?14:72}%` }}>{x}</span>)}</div></Reveal></div></section><section className="bg-background py-20"><div className="mx-auto max-w-6xl px-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Roadmap status reflects product exploration, not a medical-service promise.</div><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{roadmap.map((item,index)=><Reveal key={item.title} delay={(index%3)*70}><article className="dashboard-surface group h-full rounded-xl border border-border p-6 transition hover:-translate-y-1"><div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center rounded-lg bg-secondary"><item.icon className="h-5 w-5 text-primary" /></span><span className="rounded-full bg-accent/35 px-2.5 py-1 text-[10px] font-bold uppercase text-accent-foreground">{item.stage}</span></div><h2 className="mt-7 text-xl font-semibold">{item.title}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p><div className="mt-7"><div className="flex justify-between text-[11px] font-semibold"><span>Discovery progress</span><span>{item.progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${item.progress}%` }} /></div></div></article></Reveal>)}</div></div></section></SiteLayout>;
}