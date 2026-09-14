import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, HelpCircle, MessageSquare, ShieldCheck, Stethoscope } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Common health questions — MedBuddy FAQ | MedSafe" },
      { name: "description", content: "Plain-language answers to common health questions — fever, blood pressure, diabetes, medicines, vaccines, sleep and more — from MedSafe's MedBuddy Assistant." },
      { property: "og:title", content: "Common health questions — MedBuddy FAQ" },
      { property: "og:description", content: "Plain-language answers to everyday health questions, India-first." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FaqPage,
});

const FAQS: { q: string; a: string }[] = [
  {
    q: "When is a fever serious enough to see a doctor?",
    a: "For adults, see a doctor if fever stays above 102°F (38.9°C), lasts more than 3 days, or comes with severe headache, stiff neck, breathlessness, confusion, or a rash. For children under 3 months, any fever of 100.4°F (38°C) or more needs immediate medical attention. In a medical emergency call 112.",
  },
  {
    q: "What is a normal blood pressure reading?",
    a: "A resting reading around or below 120/80 mmHg is considered normal. 120–129 systolic with diastolic below 80 is 'elevated'. Readings consistently at or above 140/90 are usually treated as hypertension. Measure seated, rested for 5 minutes, arm at heart level — and track trends rather than one-off numbers.",
  },
  {
    q: "What is HbA1c and what should my number be?",
    a: "HbA1c reflects your average blood sugar over roughly 3 months. Below 5.7% is normal, 5.7–6.4% suggests prediabetes, and 6.5% or higher indicates diabetes. If you are diabetic, your doctor will set a personal target — often around 7%. It needs no fasting and is usually checked every 3–6 months.",
  },
  {
    q: "Should I take medicines before or after food?",
    a: "It depends on the medicine — some absorb better on an empty stomach, others irritate the stomach and must be taken after meals. Always follow the label and your doctor's instructions. If you are unsure, ask your pharmacist or ask MedBuddy — it reads your own prescriptions.",
  },
  {
    q: "Which vaccines do adults in India commonly need?",
    a: "Commonly advised adult vaccines include Influenza (yearly), Tetanus-Diphtheria (Td booster every 10 years), Hepatitis B (if not vaccinated), and — based on age, health and doctor advice — Pneumococcal, HPV and Typhoid. Upload your vaccination certificates to MedSafe Kids or your own profile so the schedule stays visible.",
  },
  {
    q: "How much sleep do I actually need?",
    a: "Most adults need 7–9 hours a night. Consistency matters as much as duration — a regular sleep and wake time improves quality more than occasional long lie-ins. If you feel unrefreshed despite enough hours, or snore heavily, discuss it with your doctor.",
  },
  {
    q: "How much water should I drink in a day?",
    a: "A practical guide is 2–3 litres of fluids a day for most adults — more in hot weather, exercise, fever, or pregnancy. Thirst and pale-yellow urine are good everyday indicators. People with kidney or heart conditions may have specific fluid limits — follow your doctor's advice.",
  },
  {
    q: "How much exercise is enough each week?",
    a: "WHO guidance: at least 150 minutes of moderate activity (brisk walking, cycling) or 75 minutes of vigorous activity per week, plus strength work twice a week. Even 10-minute walks after meals count and help blood sugar control.",
  },
  {
    q: "What do 'high' or 'low' flags on my lab report mean?",
    a: "A flag means the value fell outside the lab's reference range — it is not a diagnosis by itself. Mild deviations are common and often need only a repeat test or lifestyle changes. MedBuddy can explain each flagged value in plain language using your own report.",
  },
  {
    q: "Can I stop antibiotics once I feel better?",
    a: "No — complete the full course your doctor prescribed, even if symptoms settle early. Stopping midway lets surviving bacteria return stronger and drives antibiotic resistance. If a medicine is causing side effects, call your doctor instead of stopping on your own.",
  },
  {
    q: "Is MedBuddy a doctor?",
    a: "No. MedBuddy is an assistant that reads your own prescriptions and reports and explains them in plain language. It never diagnoses, prescribes, or changes doses. For medical decisions, always consult a qualified doctor. In an emergency call 112; for mental health support call Tele-MANAS 14416.",
  },
  {
    q: "Who can see my health data on MedSafe?",
    a: "Only you. Your records are private to your account, protected by row-level security, and MedSafe is DPDP-aligned. Family members you add live inside your account — nothing is shared with other users or sold to anyone.",
  },
];

function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <HelpCircle className="h-3 w-3" /> MedBuddy FAQ
          </div>
          <h1 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">Common health questions, in plain language</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Everyday answers written for Indian families. For questions about <em>your</em> reports, ask MedBuddy — it reads your own records.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <MessageSquare className="h-4 w-4" /> Ask MedBuddy
            </Link>
          </div>
        </div>

        <div className="mt-10 space-y-2.5">
          {FAQS.map((f, i) => {
            const open = openIdx === i;
            return (
              <div key={f.q} className="overflow-hidden rounded-xl border border-border bg-card">
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold sm:text-base">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <p className="border-t border-border/60 px-5 py-4 text-sm leading-relaxed text-muted-foreground animate-fade-in">
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            These answers are general health information, not medical advice, and never replace a consultation with a qualified doctor.
            In a medical emergency call <strong className="text-foreground">112</strong>. For mental health support, Tele-MANAS <strong className="text-foreground">14416</strong> (24×7, free).
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link to="/chat" className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-2 hover:underline">
            <Stethoscope className="h-4 w-4" /> Have a question about your own reports? Ask MedBuddy
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
