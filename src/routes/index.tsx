import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Activity, Upload, LayoutDashboard, Stethoscope, HeartPulse, Brain, ShieldCheck, Pill, HandHeart, FlaskConical, LineChart, Bell } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedSafe — Your clinical data, structured." },
      { name: "description", content: "MedSafe centralizes your medical reports and prescriptions, extracts clinical events with AI, surfaces trends, and connects you to trusted doctors across Kolkata." },
      { property: "og:title", content: "MedSafe — Your clinical data, structured." },
      { property: "og:description", content: "Centralize reports & prescriptions. AI-extracted clinical events, trend analysis, care coordination." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <SiteLayout>
      <Hero />
      <ImpactStrip />
      <Mission />
      <Services />
      <Stakeholders />
      <HowItWorks />
      <Tech />
      <Testimonials />
      <CTA />
    </SiteLayout>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-60" style={{
        background: "radial-gradient(60% 60% at 20% 10%, oklch(0.92 0.06 175) 0%, transparent 60%), radial-gradient(50% 50% at 90% 30%, oklch(0.95 0.04 145) 0%, transparent 60%)",
      }} />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Clinician-led · OCR + LLM · Built for India
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Your health, finally in <span className="text-primary">one structured place.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            India loses lives to <span className="text-foreground font-medium">fragmented health records</span>, not to a lack of medicine.
            MedSafe unifies every report, prescription and clinical note — and our OCR + LLM pipeline
            extracts every clinical event so you and your doctor act <span className="text-foreground font-medium">earlier, faster, together</span>.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/upload" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
              <Upload className="h-4 w-4" /> Upload your first report
            </Link>
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-accent">
              <LayoutDashboard className="h-4 w-4" /> View dashboard
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 text-sm">
            <Stat label="Stakeholders" value="3" sub="Patient · Doctor · Lab" />
            <Stat label="Trends" value="Real-time" sub="HbA1c · BP · Lipids" />
            <Stat label="Care radius" value="Kolkata" sub="Doctors & hospitals" />
          </div>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-primary/15 to-accent/40 blur-2xl" />
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <HeartPulse className="h-3.5 w-3.5 text-primary" /> Live patient snapshot
          </div>
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-700">Trend ↗ improving</span>
        </div>
        <div className="mt-3 text-sm font-semibold">Dipti M. · 62 · F</div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { k: "FBS", v: "119", t: "▲ high", tone: "orange" },
            { k: "TSH", v: "2.5", t: "normal", tone: "green" },
            { k: "BP", v: "120/70", t: "normal", tone: "green" },
          ].map((m) => (
            <div key={m.k} className="rounded-lg border border-border bg-background/60 p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.k}</div>
              <div className="mt-0.5 text-base font-semibold">{m.v}</div>
              <div className={`text-[10px] font-medium ${m.tone === "green" ? "text-green-700" : "text-orange-700"}`}>{m.t}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-border bg-background/60 p-3">
          <div className="text-xs font-medium">Visit · 23 Jun 2026</div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>• Diabetes Mellitus + Hypothyroidism</li>
            <li>• Cetaphil XR 500mg · 1 BD PC</li>
            <li>• Follow-up call on 30 Jun 2026</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ImpactStrip() {
  const items = [
    { v: "70%", l: "of consult time lost to history-taking — we cut it to seconds." },
    { v: "1 in 3", l: "Indians lose key reports between visits. Never again." },
    { v: "10 days", l: "smart window groups labs to the visit that ordered them." },
    { v: "24/7", l: "your structured history, ready to share with any doctor." },
  ];
  return (
    <section className="border-y border-border/60 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.v}>
            <div className="text-2xl font-semibold">{i.v}</div>
            <div className="mt-1 text-xs text-primary-foreground/80">{i.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Mission() {
  const cards = [
    { icon: HandHeart, t: "Human welfare first", d: "Every feature is built so a parent in Behala or a senior in Salt Lake gets the same standard of care a hospital VIP would." },
    { icon: ShieldCheck, t: "Clinical efficiency", d: "Structured extraction, not scanned PDFs. Doctors see lab trends, medicines and diagnoses on one screen — not WhatsApp threads." },
    { icon: Brain, t: "Earlier, smarter decisions", d: "Anomaly detection on lipids, sugar, kidney & liver panels alerts you before the next emergency, not after." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.t} className="rounded-2xl border border-border bg-card p-6">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <c.icon className="h-5 w-5" />
            </div>
            <div className="mt-4 text-lg font-semibold">{c.t}</div>
            <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Upload anything", d: "Lab PDF, prescription photo, discharge summary — drag & drop or snap." },
    { n: "02", t: "We extract everything", d: "OCR + LLM pulls diagnoses, medicines, lab values and ref ranges into clean structured fields." },
    { n: "03", t: "Auto-grouped into visits", d: "Tests within 10 days of a prescription are linked to the same visit, with the right doctor attached." },
    { n: "04", t: "Trends & alerts", d: "Charts surface improvements and concerns automatically — shareable with any doctor in one click." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="text-xs uppercase tracking-wider text-primary">How it works</div>
      <h2 className="mt-1 text-3xl font-semibold tracking-tight">From scattered PDFs to a clinical-grade record — in minutes</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.n} className="relative rounded-xl border border-border bg-card p-5">
            <div className="text-xs font-semibold text-primary">{s.n}</div>
            <div className="mt-2 font-medium">{s.t}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const t = [
    { q: "I used to carry a polythene bag of reports to every appointment. Now my doctor opens MedSafe and reads my entire history in 30 seconds.", a: "Sutapa M., patient · Kolkata" },
    { q: "The visit-to-visit summary is what I wish every EMR did. It tells me what improved and what to worry about — without me digging.", a: "Dr. R. Banerjee, Internal Medicine" },
    { q: "Pre-consult time dropped by half. Patients arrive structured, and we spend the visit treating, not transcribing.", a: "Apollo Gleneagles, OPD lead" },
  ];
  return (
    <section className="border-y border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-xs uppercase tracking-wider text-primary">Voices</div>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Built with patients and clinicians, not for them.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {t.map((x) => (
            <figure key={x.a} className="rounded-xl bg-card p-6 ring-1 ring-border">
              <blockquote className="text-sm text-foreground/90">"{x.q}"</blockquote>
              <figcaption className="mt-4 text-xs text-muted-foreground">{x.a}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

const SERVICE_CARDS = [
  { to: "/upload" as const, icon: Upload, title: "Upload Reports & Prescriptions", text: "OCR + Gemini extraction. Chunked for precise clinical event capture." },
  { to: "/dashboard" as const, icon: LineChart, title: "Trends & Anomaly Detection", text: "Track HbA1c, lipids, BP, kidney & liver panels over time. Critical values flagged automatically." },
  { to: "/doctors" as const, icon: Stethoscope, title: "Trusted Doctors in Kolkata", text: "Send your structured history to top consultants. Rating-based recommendations." },
  { to: "/care" as const, icon: HandHeart, title: "Care-giving for Parents", text: "Designated representative visits with a routine kit. Updates BP, sugar & vitals to your dashboard." },
  { to: "/services" as const, icon: HeartPulse, title: "Diabetes Management", text: "Clinician-led diabetes program with structured notes, alerts and medication tracking." },
  { to: "/services" as const, icon: Pill, title: "Medicines at Doorstep", text: "Once we have your prescriptions, reorders take seconds. Delivered to your door." },
  { to: "/services" as const, icon: Bell, title: "Smart Reminders", text: "Be notified for the next check-up, fasting test, follow-up visit or vaccination." },
  { to: "/services" as const, icon: Brain, title: "Future: Digital Twin & Genomics", text: "As data grows, unlock pre-cancer detection, genomic insights, and personalized digital twins." },
];

function Services() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-primary">What MedSafe does</div>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">A circular ecosystem for clinical care</h2>
        </div>
        <Link to="/services" className="hidden text-sm text-primary hover:underline sm:inline">Browse all services →</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICE_CARDS.map((s, i) => (
          <Link key={i} to={s.to} className="group rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="mt-4 font-medium">{s.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.text}</div>
            <div className="mt-3 text-xs text-primary opacity-0 transition group-hover:opacity-100">Open →</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Stakeholders() {
  const items = [
    { icon: Activity, t: "Patient", d: "Unique MedSafe ID at sign-up. Every report, prescription and vital lands in one timeline you control." },
    { icon: Stethoscope, t: "Doctor", d: "See structured history in seconds. Cut consult time, raise diagnostic accuracy, prescribe with full context." },
    { icon: FlaskConical, t: "Lab", d: "Test results auto-attach to the prescribing visit. No more loose PDFs lost in WhatsApp." },
  ];
  return (
    <section className="border-y border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-xs uppercase tracking-wider text-primary">Three stakeholders, one platform</div>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Built around how care actually flows</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((i) => (
            <div key={i.t} className="rounded-xl bg-card p-6 ring-1 ring-border">
              <i.icon className="h-6 w-6 text-primary" />
              <div className="mt-3 text-lg font-medium">{i.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{i.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Tech() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="text-xs uppercase tracking-wider text-primary">Under the hood</div>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">High-fidelity clinical extraction</h2>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> OCR + chunking for accurate, retrievable clinical events.</li>
            <li className="flex gap-3"><Brain className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> Gemini LLM extracts diagnoses, medicines, lab values, ref ranges and flags.</li>
            <li className="flex gap-3"><LineChart className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> Time-series engine groups visits within a 10-day window into a single clinical episode.</li>
            <li className="flex gap-3"><Activity className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> Trend & anomaly model surfaces critical changes before they escalate.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Sample extraction</div>
          <pre className="overflow-auto rounded-lg bg-secondary p-4 text-xs leading-relaxed text-foreground/80">{`{
  "kind": "report",
  "title": "Diabetes + Thyroid panel",
  "date": "2026-06-23",
  "patientName": "Mrs. Dipti Mondal",
  "labValues": [
    { "name": "FBS",  "value": 119, "unit": "mg/dL", "flag": "high" },
    { "name": "PPBS", "value": 169, "unit": "mg/dL", "flag": "high" },
    { "name": "TSH",  "value": 2.5, "unit": "mIU/L", "flag": "normal" }
  ],
  "diagnoses": ["Diabetes Mellitus", "Hypothyroidism"]
}`}</pre>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="rounded-2xl bg-primary p-10 text-primary-foreground">
        <h3 className="text-2xl font-semibold">We care about your health — so you can enjoy your life.</h3>
        <p className="mt-2 max-w-2xl text-primary-foreground/80">Start by uploading one report. We'll structure the rest.</p>
        <Link to="/upload" className="mt-6 inline-flex items-center gap-2 rounded-md bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-background/90">
          <Upload className="h-4 w-4" /> Upload a report
        </Link>
      </div>
    </section>
  );
}
