import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { HandHeart, HeartPulse, ClipboardList, Truck, Bell, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/care")({
  head: () => ({
    meta: [
      { title: "Care & Diabetes Programs — MedSafe" },
      { name: "description", content: "Care-giving for parents, diabetes management, doorstep medicines and reminders — all clinician-led." },
    ],
  }),
  component: CarePage,
});

function CarePage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-xs uppercase tracking-wider text-primary">Care programs</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Coordinated care for your family</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Especially useful when your parents live far away. A trained representative visits with a routine kit; everything updates to your dashboard.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Tile icon={HandHeart} title="Care-giving visits" body="Designated representative checks BP, sugar, SpO₂, weight and routine vitals with a simple kit. Reports auto-uploaded.">
            <Link to="/upload" className="text-xs text-primary hover:underline">Schedule a visit →</Link>
          </Tile>
          <Tile icon={HeartPulse} title="Diabetes management" body="Clinician-led program. HbA1c trend tracking, medication adherence, diet logs and clinical notes by your diabetologist.">
            <Link to="/dashboard" className="text-xs text-primary hover:underline">Open dashboard →</Link>
          </Tile>
          <Tile icon={ClipboardList} title="Structured clinical notes" body="Every observation, doctor's note and instruction is stored against the right visit — never lost in WhatsApp again.">
            <Link to="/upload" className="text-xs text-primary hover:underline">Add a note →</Link>
          </Tile>
          <Tile icon={Truck} title="Medicines at doorstep" body="From your latest prescription, reorder in one tap. Delivered to your parent's address.">
            <span className="text-xs text-muted-foreground">Coming with first prescription on file</span>
          </Tile>
          <Tile icon={Bell} title="Smart reminders" body="Fasting tests, follow-ups, vaccinations and refills — proactive nudges, never missed.">
            <Link to="/dashboard" className="text-xs text-primary hover:underline">See upcoming →</Link>
          </Tile>
          <Tile icon={Stethoscope} title="Escalation to specialist" body="If a critical flag is detected, our clinician triages and connects you with the right specialist in Kolkata.">
            <Link to="/doctors" className="text-xs text-primary hover:underline">Browse network →</Link>
          </Tile>
        </div>
      </section>
    </SiteLayout>
  );
}

function Tile({ icon: Icon, title, body, children }: { icon: any; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="h-5 w-5" /></div>
      <div className="mt-3 font-medium">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}
