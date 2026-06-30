import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Activity, Upload, LineChart, Stethoscope, HandHeart, HeartPulse, Pill, Bell, Brain, ShieldCheck, FlaskConical, Hospital } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — MedSafe" },
      { name: "description", content: "Every MedSafe service: report storage, AI extraction, trends, diabetes care, doctor network, care-giving and more." },
    ],
  }),
  component: ServicesPage,
});

const GROUPS: { title: string; items: { icon: any; title: string; text: string; to: "/upload" | "/dashboard" | "/doctors" | "/care" | "/services" }[] }[] = [
  {
    title: "Records & Intelligence",
    items: [
      { icon: Upload, title: "Upload Reports & Prescriptions", text: "PDFs and images. OCR + LLM extraction with chunking.", to: "/upload" },
      { icon: LineChart, title: "Trend Analysis", text: "HbA1c, fasting sugar, lipids, BP, eGFR, LFTs visualized over time.", to: "/dashboard" },
      { icon: ShieldCheck, title: "Anomaly & Critical Flags", text: "Out-of-range and critical values surfaced automatically.", to: "/dashboard" },
      { icon: Bell, title: "Smart Reminders", text: "Next check-up, fasting tests, vaccinations, medication refills.", to: "/dashboard" },
    ],
  },
  {
    title: "Care Network",
    items: [
      { icon: Stethoscope, title: "Kolkata Doctor Network", text: "Curated consultants by specialty and rating. Share structured history in one click.", to: "/doctors" },
      { icon: Hospital, title: "Specialty Diagnostics", text: "Right hospital for the right test — Tata Medical (oncology), RTIICS (cardiac), more.", to: "/doctors" },
      { icon: HandHeart, title: "Care-giving for Parents", text: "Trained representative visits with kit; vitals updated to your dashboard.", to: "/care" },
      { icon: HeartPulse, title: "Diabetes Management Program", text: "Clinician-led; structured notes, alerts and adherence tracking.", to: "/care" },
    ],
  },
  {
    title: "Convenience & Future",
    items: [
      { icon: Pill, title: "Medicines at Doorstep", text: "Reorder from your prescriptions; doorstep delivery once trust is built.", to: "/services" },
      { icon: Brain, title: "Digital Twin (roadmap)", text: "Personalized simulation of your physiology as your data grows.", to: "/services" },
      { icon: FlaskConical, title: "Genomics & Pre-cancer (roadmap)", text: "Early detection models powered by longitudinal data + genomics.", to: "/services" },
    ],
  },
];

function ServicesPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-xs uppercase tracking-wider text-primary">All services</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Everything MedSafe does, in one place</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Each tile is clickable. The product is clinician-led — anything flagged is escalated before action.</p>

        {GROUPS.map((g) => (
          <div key={g.title} className="mt-10">
            <h2 className="text-lg font-semibold">{g.title}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {g.items.map((s) => (
                <Link key={s.title} to={s.to} className="group rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 font-medium">{s.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.text}</div>
                  <div className="mt-3 text-xs text-primary opacity-0 transition group-hover:opacity-100">Open →</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </SiteLayout>
  );
}
