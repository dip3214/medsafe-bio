import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { KOLKATA_DOCTORS, KOLKATA_HOSPITALS } from "@/lib/doctors";
import { useMemo, useState } from "react";
import { Search, Star, MapPin, Send, Hospital as HospitalIcon } from "lucide-react";

export const Route = createFileRoute("/doctors")({
  head: () => ({
    meta: [
      { title: "Doctors & Hospitals — Kolkata · MedSafe" },
      { name: "description", content: "Curated consultants and specialty diagnostic hospitals across Kolkata. Share your structured history in one click." },
    ],
  }),
  component: DoctorsPage,
});

function DoctorsPage() {
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState<string>("All");
  const specs = useMemo(() => ["All", ...Array.from(new Set(KOLKATA_DOCTORS.map((d) => d.specialty)))], []);
  const filtered = useMemo(() => KOLKATA_DOCTORS.filter(
    (d) => (spec === "All" || d.specialty === spec) &&
      (q === "" || d.name.toLowerCase().includes(q.toLowerCase()) || d.hospital.toLowerCase().includes(q.toLowerCase()) || d.area.toLowerCase().includes(q.toLowerCase())),
  ), [q, spec]);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="text-xs uppercase tracking-wider text-primary">Care network</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Trusted doctors & hospitals in Kolkata</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Send your structured history to any consultant in one click. Rating-led; specialty-mapped to the right diagnostic hospital.</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, hospital, area"
              className="w-72 rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <select value={spec} onChange={(e) => setSpec(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm">
            {specs.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {filtered.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{d.name}</div>
                  <div className="text-sm text-primary">{d.specialty}</div>
                  <div className="mt-1 text-sm text-muted-foreground"><HospitalIcon className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />{d.hospital}</div>
                  <div className="text-xs text-muted-foreground"><MapPin className="-mt-0.5 mr-1 inline h-3 w-3" />{d.area}</div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                    <Star className="h-3 w-3 fill-current" /> {d.rating}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{d.experienceYears} yrs · ₹{d.consultationFee}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                  <Send className="h-3.5 w-3.5" /> Share my history
                </button>
                <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent">Book consultation</button>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-semibold">Specialty diagnostic hospitals</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {KOLKATA_HOSPITALS.map((h) => (
            <div key={h.id} className="rounded-xl border border-border bg-card p-4">
              <div className="font-medium">{h.name}</div>
              <div className="text-xs text-muted-foreground"><MapPin className="-mt-0.5 mr-1 inline h-3 w-3" />{h.area}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {h.specialties.map((s) => <span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">{s}</span>)}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{h.diagnosticsFocus}</div>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
