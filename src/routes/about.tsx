import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, HeartPulse, MapPin, Phone, ShieldCheck, Users } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About MedSafe | Our Mission and Founders" },
      { name: "description", content: "Meet the team building MedSafe and our mission to make family health records organised, understandable and useful." },
      { property: "og:title", content: "About MedSafe | Family health, clearly connected" },
      { property: "og:description", content: "Our mission, principles, founders and contact details across Kolkata and London." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://med-safe.live/about" }],
  }),
  component: AboutPage,
});

const founders = [
  { name: "Dr. Jit Sarkar", role: "Co-founder · Research & Development", detail: "MBBS, PhD", initials: "JS" },
  { name: "Dipankar Mandal", role: "Co-founder · Strategy & Operations", detail: "Engineering Management · Financial Engineering", initials: "DM" },
];

function AboutPage() {
  return (
    <SiteLayout>
      <section className="ambient-health-bg overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-[1.15fr_.85fr] lg:items-end lg:py-28">
          <Reveal>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">About MedSafe</div>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight sm:text-6xl">Health information should help families act, not leave them searching.</h1>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-lg leading-relaxed text-muted-foreground">MedSafe turns scattered prescriptions, reports and daily health signals into one private timeline that families and clinicians can understand together.</p>
          </Reveal>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-5 md:grid-cols-3">
            <Mission icon={HeartPulse} title="Our mission">Make every family’s health history organised, understandable and useful when it matters.</Mission>
            <Mission icon={ShieldCheck} title="Our promise">Keep explanations grounded in the family’s own records and support, never replace, qualified clinical judgement.</Mission>
            <Mission icon={Users} title="Who we serve">People coordinating care for themselves, children, parents and loved ones across different clinics and cities.</Mission>
          </div>

          <Reveal>
            <div className="mt-24 border-t border-border pt-12">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">The people behind MedSafe</div>
              <h2 className="mt-3 font-serif text-3xl sm:text-5xl">Built from lived caregiving experience.</h2>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {founders.map((founder, index) => (
              <Reveal key={founder.name} delay={index * 100}>
                <article className="dashboard-surface flex h-full items-center gap-5 rounded-xl border border-border p-6">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary font-serif text-xl text-primary-foreground">{founder.initials}</div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-2xl">{founder.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-primary">{founder.role}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{founder.detail}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div id="contact" className="mt-24 scroll-mt-28 rounded-xl bg-primary p-7 text-primary-foreground sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-end">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground/65">Contact us</div>
                  <h2 className="mt-3 font-serif text-3xl">Let’s make family care easier.</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <a href="tel:+919007374836" className="flex gap-3"><Phone className="mt-0.5 h-5 w-5 shrink-0" /><span className="text-sm">+91 9007374836</span></a>
                  <div className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0" /><span className="text-sm">Kolkata, India<br />London, UK</span></div>
                  <div className="flex gap-3"><GraduationCap className="mt-0.5 h-5 w-5 shrink-0" /><span className="text-sm">Associated with King’s College London</span></div>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="mt-10 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">Explore MedSafe <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Mission({ icon: Icon, title, children }: { icon: typeof HeartPulse; title: string; children: React.ReactNode }) {
  return <Reveal><article className="h-full border-t-2 border-primary pt-5"><Icon className="h-6 w-6 text-primary" /><h2 className="mt-5 font-serif text-2xl">{title}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</p></article></Reveal>;
}