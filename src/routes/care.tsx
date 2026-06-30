import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { HandHeart, HeartPulse, ClipboardList, Truck, Bell, Stethoscope, Wallet } from "lucide-react";
import { Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/care")({
  head: () => ({
    meta: [
      { title: "Upcoming — MedSafe Care" },
      { name: "description", content: "Coming soon: care-giving for parents, diabetes management, doorstep medicines, reminders and healthcare spending planning." },
    ],
  }),
  component: CarePage,
});

function CarePage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-xs uppercase tracking-wider text-primary">Upcoming</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">What we're building next</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          These features aren't live yet. We're shipping them carefully, one at a time. Tell us which to prioritise.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Tile icon={HandHeart} title="Care-giving visits" body="Designated representative checks BP, sugar, SpO₂, weight and routine vitals with a simple kit. Reports auto-uploaded." />
          <Tile icon={HeartPulse} title="Diabetes management" body="Clinician-led program. HbA1c trend tracking, medication adherence, diet logs and clinical notes by your diabetologist." />
          <Tile icon={ClipboardList} title="Structured clinical notes" body="Every observation, doctor's note and instruction stored against the right visit — never lost in WhatsApp again." />
          <Tile icon={Truck} title="Medicines at doorstep" body="From your latest prescription, reorder in one tap. Delivered to your parent's address." />
          <Tile icon={Bell} title="Smart reminders" body="Fasting tests, follow-ups, vaccinations and refills — proactive nudges, never missed." />
          <Tile icon={Stethoscope} title="Escalation to specialist" body="If a critical flag is detected, our clinician triages and connects you with the right specialist." />
          <Tile icon={Wallet} title="Manage your healthcare spending" body="Track and plan your family's medical expenses, so healthcare costs never catch you by surprise." />
        </div>
      </section>
    </SiteLayout>
  );
}

function Tile({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <Reveal as="div" className="relative rounded-xl border border-border bg-card p-5">
      <span className="absolute right-3 top-3 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Coming soon</span>
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="h-5 w-5" /></div>
      <div className="mt-3 font-medium">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </Reveal>
  );
}
