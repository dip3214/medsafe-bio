import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, ArrowLeft, FileText, HeartPulse, MessageCircle, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { listMedicalDocs } from "@/lib/medsafe.functions";
import { groupDocs, type MedicalDoc, type VisitGroup } from "@/lib/medsafe-types";
import { useActiveMember } from "@/lib/active-member";
import { renderSummaryPdf, triggerDownload } from "@/lib/pdf-summary";

export const Route = createFileRoute("/_authenticated/summary")({
  head: () => ({
    meta: [
      { title: "Summary report — MedSafe" },
      { name: "description", content: "A printable clinical summary of your last two visits — diagnoses, medicines, lab deltas and action items." },
    ],
  }),
  component: SummaryPage,
});

function SummaryPage() {
  const { active } = useActiveMember();
  const list = useServerFn(listMedicalDocs);
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["medsafe-docs", active?.id ?? null],
    queryFn: () => list({ data: { memberId: active?.id } }) as Promise<MedicalDoc[]>,
  });

  const groups = useMemo(() => groupDocs(docs), [docs]);
  const visits = groups.slice(0, 2); // last 2 (most recent first)

  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const articleRef = useRef<HTMLElement | null>(null);

  function buildPdf() {
    return renderSummaryPdf(active?.name ?? "Patient", visits);
  }


  async function downloadPdf() {
    setDownloading(true);
    try {
      const pdf = await buildPdf();
      triggerDownload(pdf);
      setTimeout(() => URL.revokeObjectURL(pdf.url), 4000);
    } catch (e) {
      console.error("[summary] download failed", e);
      alert("Sorry — couldn't build the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function shareSummary() {
    setSharing(true);
    try {
      const pdf = await buildPdf();
      const file = new File([pdf.blob], pdf.filename, { type: "application/pdf" });

      // Prefer native file share (iOS Safari, Android Chrome) — this lets
      // the user pick WhatsApp and actually attaches the PDF.
      const nav = navigator as any;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await nav.share({
            files: [file],
            title: "MedSafe summary",
            text: `${active?.name ?? "Patient"} — health summary from MedSafe`,
          });
          return;
        } catch { /* user cancelled — fall through */ }
      }

      // Desktop / unsupported: download the PDF so the user has the file,
      // then open WhatsApp Web with a short message they can attach it to.
      triggerDownload(pdf);
      const msg = `${active?.name ?? "Patient"}'s MedSafe health summary is attached (downloaded to this device).`;
      const wa = `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
      const { openInNewTab } = await import("@/lib/ios-open");
      openInNewTab(wa);
      setTimeout(() => URL.revokeObjectURL(pdf.url), 60_000);
    } catch (e) {
      console.error("[summary] share failed", e);
      alert("Sorry — couldn't share the summary. Please try downloading instead.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={shareSummary}
              disabled={sharing || downloading || visits.length === 0}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" /> {sharing ? "Preparing PDF…" : "Share PDF (WhatsApp)"}
            </button>
            <button
              onClick={downloadPdf}
              disabled={downloading || sharing || visits.length === 0}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "oklch(0.42 0.16 28)" }}
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {downloading ? "Building PDF…" : "Download PDF"}
            </button>
          </div>
        </div>


        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : visits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No visits yet. Upload a report from <Link to="/upload" className="text-primary underline">Upload</Link> to generate a summary.
          </div>
        ) : (
          <article className="rounded-2xl border border-border bg-card p-8 print:border-0 print:shadow-none">
            <header className="border-b border-border pb-5">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-11 w-11 place-items-center rounded-full text-white shadow-sm"
                  style={{ background: "oklch(0.42 0.16 28)" }}
                >
                  <HeartPulse className="h-6 w-6" />
                </span>
                <div>
                  <div className="text-lg font-semibold tracking-tight">
                    med<span style={{ color: "oklch(0.42 0.16 28)" }}>Safe</span>
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    One family. One health record.
                  </div>
                </div>
                <div className="ml-auto text-right text-[11px] text-muted-foreground print:block">
                  Generated {new Date().toLocaleDateString("en-IN")}
                </div>
              </div>
              <div className="mt-5 text-xs uppercase tracking-wider text-primary">Clinical summary report</div>
              <h1 className="mt-1 font-display text-3xl">{active?.name ?? "Patient"} — Health summary</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {visits.length === 1
                  ? "Based on your most recent visit."
                  : `Based on your last ${visits.length} visits, ${visits[1].endDate} → ${visits[0].startDate}.`}
              </p>
            </header>

            {visits.map((v, i) => (
              <VisitBlock key={v.id} visit={v} label={i === 0 ? "Most recent visit" : "Previous visit"} />
            ))}

            {visits.length === 2 && <Comparison latest={visits[0]} previous={visits[1]} />}

            <footer className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
              This summary is generated from your uploaded records and is not a substitute for medical advice.
              Discuss with your physician before any treatment change. — MedSafe
            </footer>
          </article>
        )}
      </section>
    </SiteLayout>
  );
}

function VisitBlock({ visit, label }: { visit: VisitGroup; label: string }) {
  const allMeds = visit.docs.flatMap((d) => d.medicines ?? []);
  const allDx = visit.docs.flatMap((d) => d.diagnoses ?? []);
  const allLabs = visit.docs.flatMap((d) => d.labValues ?? []);
  const summary = visit.docs.find((d) => d.summary)?.summary;

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl">{label}</h2>
        <div className="text-xs text-muted-foreground">
          {visit.startDate === visit.endDate ? visit.startDate : `${visit.startDate} → ${visit.endDate}`}
          {visit.doctor ? ` · Dr. ${visit.doctor}` : ""}
          {visit.hospital ? ` · ${visit.hospital}` : ""}
        </div>
      </div>

      {summary && <p className="mt-3 rounded-md bg-accent/40 p-3 text-sm">{summary}</p>}

      {allDx.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Diagnoses</div>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {Array.from(new Set(allDx)).map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}

      {allMeds.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Medicines</div>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {allMeds.map((m, i) => (
              <li key={i}>
                <span className="font-medium">{m.name}</span>
                {m.dose ? ` · ${m.dose}` : ""}{m.frequency ? ` · ${m.frequency}` : ""}{m.duration ? ` · ${m.duration}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {allLabs.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lab values</div>
          <table className="mt-1 w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr><th className="text-left font-normal">Test</th><th className="text-right font-normal">Value</th><th className="text-left font-normal pl-3">Ref</th><th className="text-left font-normal pl-3">Flag</th></tr>
            </thead>
            <tbody>
              {allLabs.map((l, i) => (
                <tr key={i} className="border-t border-border/50">
                  <td className="py-1">{l.name}</td>
                  <td className="py-1 text-right font-medium">{l.value}{l.unit ? ` ${l.unit}` : ""}</td>
                  <td className="py-1 pl-3 text-muted-foreground">{l.refRange || "—"}</td>
                  <td className="py-1 pl-3">{l.flag || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileText className="h-3 w-3" /> {visit.docs.length} document{visit.docs.length > 1 ? "s" : ""}
      </div>
    </section>
  );
}

function Comparison({ latest, previous }: { latest: VisitGroup; previous: VisitGroup }) {
  const map = (g: VisitGroup) => {
    const m = new Map<string, number>();
    for (const d of g.docs) for (const v of d.labValues ?? []) {
      const num = typeof v.value === "number" ? v.value : parseFloat(String(v.value));
      if (Number.isFinite(num)) m.set(v.name.trim(), num);
    }
    return m;
  };
  const a = map(previous);
  const b = map(latest);
  const rows: { name: string; from: number; to: number; pct: number }[] = [];
  for (const [k, v] of b) {
    if (a.has(k)) {
      const from = a.get(k)!;
      const pct = from !== 0 ? ((v - from) / from) * 100 : 0;
      rows.push({ name: k, from, to: v, pct });
    }
  }
  rows.sort((x, y) => Math.abs(y.pct) - Math.abs(x.pct));
  if (rows.length === 0) return null;
  return (
    <section className="mt-8 rounded-xl border border-border bg-accent/20 p-4">
      <h2 className="font-display text-xl">What changed</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {rows.slice(0, 8).map((r) => (
          <li key={r.name}>
            <span className="font-medium">{r.name}</span>: {r.from} → {r.to}{" "}
            <span className={r.pct < 0 ? "text-green-700" : "text-orange-700"}>
              ({r.pct >= 0 ? "+" : ""}{r.pct.toFixed(1)}%)
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
