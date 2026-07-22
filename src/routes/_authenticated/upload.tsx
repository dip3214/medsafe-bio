import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { extractClinicalDoc } from "@/lib/extract.functions";
import { createMedicalDoc, deleteMedicalDoc, listMedicalDocs, getDocumentSignedUrl } from "@/lib/medsafe.functions";
import { groupDocs } from "@/lib/medsafe-types";
import type { MedicalDoc } from "@/lib/medsafe-types";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Loader2, Pill, FlaskConical, Stethoscope, CalendarDays, Trash2, AlertTriangle, UserRound, ExternalLink } from "lucide-react";
import { useActiveMember } from "@/lib/active-member";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({
    meta: [
      { title: "Upload Reports — MedSafe" },
      { name: "description", content: "Upload medical reports and prescriptions. AI extracts clinical events; documents within 10 days of the same doctor are grouped into one visit." },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const qc = useQueryClient();
  const extract = useServerFn(extractClinicalDoc);
  const createDoc = useServerFn(createMedicalDoc);
  const removeDoc = useServerFn(deleteMedicalDoc);
  const listDocs = useServerFn(listMedicalDocs);
  const { active } = useActiveMember();

  const { data: docs = [] } = useQuery({
    queryKey: ["medsafe-docs", active?.id ?? null],
    queryFn: () => listDocs({ data: { memberId: active?.id } }) as Promise<MedicalDoc[]>,
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [kind, setKind] = useState<"auto" | "report" | "prescription">("auto");

  const delMut = useMutation({
    mutationFn: (id: string) => removeDoc({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medsafe-docs"] }),
  });

  async function onFile(file: File) {
    setErr(null);
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const dataUrl = await readAsDataUrl(file);
      const parsed = await extract({ data: { fileDataUrl: dataUrl, mimeType: file.type || "image/jpeg", hint: kind } });

      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
      const path = `${u.user.id}/${crypto.randomUUID()}${ext}`;
      const { error: upErr } = await supabase.storage.from("medical-documents").upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (upErr) throw upErr;

      await createDoc({ data: {
        storagePath: path, fileName: file.name, mimeType: file.type || "application/octet-stream",
        fileSize: file.size, parsed, memberId: active?.id,
      }});
      qc.invalidateQueries({ queryKey: ["medsafe-docs"] });
    } catch (e: any) {
      setErr(e?.message || "Failed to process file");
    } finally {
      setBusy(false);
    }
  }

  const groups = groupDocs(docs);
  const patientMeta = [...docs].reverse().find((d) => d.patientName);
  const patient = patientMeta?.patientName;

  return (
    <SiteLayout>
      
      <section className="mx-auto max-w-6xl px-4 pt-2 pb-10">
        <div className="text-xs uppercase tracking-wider text-primary">Your records</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Bring every report under one roof</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Drop a prescription or lab report — we read it, pull out diagnoses, medicines and lab values,
          and stitch documents from the <span className="font-medium text-foreground">same doctor within 10 days</span> into a single visit on your timeline.
        </p>

        {patient && (
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-gradient-to-r from-primary/10 to-accent/40 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
              <UserRound className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Patient</div>
              <div className="text-xl font-semibold">{patient}</div>
              <div className="text-xs text-muted-foreground">
                {[patientMeta?.patientAge, patientMeta?.patientGender].filter(Boolean).join(" · ")}
                {patientMeta?.patientAge || patientMeta?.patientGender ? " · " : ""}
                {docs.length} document{docs.length > 1 ? "s" : ""} on file
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-muted-foreground">Type:</label>
            <div className="flex gap-1 rounded-md bg-secondary p-1 text-sm">
              {(["auto", "report", "prescription"] as const).map((k) => (
                <button key={k} onClick={() => setKind(k)}
                  className={`rounded px-3 py-1 capitalize ${kind === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground">
              <Upload className="h-6 w-6" />
            </div>
            <div className="text-sm text-muted-foreground">Drop file here or click to choose. PDF, JPG, PNG.</div>
            <label className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {busy ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Working…</span> : "Choose file"}
              <input type="file" accept="image/*,application/pdf" className="hidden" disabled={busy}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
            </label>
            {busy && <ExtractionLoader />}
            {err && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4" /> {err}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold">Visit timeline</h2>
              <p className="text-sm text-muted-foreground">Each block is a single clinical visit — prescriptions and the tests that followed.</p>
            </div>
            <div className="text-xs text-muted-foreground">{docs.length} documents · {groups.length} visits</div>
          </div>

          {groups.length === 0 ? (
            <div className="mt-6 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No documents yet. Upload a report or prescription to begin your timeline.
            </div>
          ) : (
            <ol className="mt-6 space-y-6">
              {groups.map((g) => (
                <li key={g.id} className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {g.startDate === g.endDate ? g.startDate : `${g.startDate} → ${g.endDate}`}
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {g.doctor ? `Visit · ${g.doctor}` : "Visit"}
                        {g.hospital && <span className="ml-2 text-sm font-normal text-muted-foreground">@ {g.hospital}</span>}
                      </div>
                    </div>
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">
                      {g.docs.length} document{g.docs.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {g.docs.map((d) => (
                      <DocCard key={d.id} d={d} onDelete={() => delMut.mutate(d.id)} />
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function DocCard({ d, onDelete }: { d: MedicalDoc; onDelete: () => void }) {
  const Icon = d.kind === "prescription" ? Pill : FlaskConical;
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium">{d.title}</div>
            <div className="text-xs text-muted-foreground">
              {d.date}
              {d.doctor && <> · <Stethoscope className="-mt-0.5 mr-0.5 inline h-3 w-3" />{d.doctor}</>}
            </div>
          </div>
        </div>
        <button onClick={onDelete} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-destructive" aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {d.summary && <p className="mt-3 text-sm text-foreground/80">{d.summary}</p>}
      {!!d.diagnoses?.length && (
        <div className="mt-3 flex flex-wrap gap-1">
          {d.diagnoses.map((dx, i) => <span key={i} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{dx}</span>)}
        </div>
      )}
      {!!d.medicines?.length && (
        <div className="mt-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Medicines</div>
          <ul className="mt-1 space-y-0.5 text-sm">
            {d.medicines.slice(0, 6).map((m, i) => (
              <li key={i}>• <span className="font-medium">{m.name}</span> {m.dose && <>· {m.dose}</>} {m.frequency && <>· {m.frequency}</>} {m.duration && <>· {m.duration}</>}</li>
            ))}
          </ul>
        </div>
      )}
      {!!d.labValues?.length && (
        <div className="mt-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lab values</div>
          <div className="mt-1 overflow-hidden rounded border border-border">
            <table className="w-full text-xs">
              <tbody>
                {d.labValues.slice(0, 8).map((v, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="px-2 py-1">{v.name}</td>
                    <td className="px-2 py-1 font-medium">{String(v.value)} {v.unit}</td>
                    <td className="px-2 py-1 text-muted-foreground">{v.refRange}</td>
                    <td className="px-2 py-1"><span className={`rounded px-1.5 py-0.5 text-[10px] ${flagClass(v.flag)}`}>{v.flag || "—"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {d.storagePath && <ViewOriginalButton docId={d.id} fileName={d.title} />}
    </div>
  );
}

function ViewOriginalButton({ docId, fileName }: { docId: string; fileName?: string }) {
  const sign = useServerFn(getDocumentSignedUrl);
  const [busy, setBusy] = useState<"open" | "download" | null>(null);
  async function open(kind: "open" | "download") {
    setBusy(kind);
    try {
      const { url } = await sign({ data: { documentId: docId } });
      const { openInNewTab, downloadUrl } = await import("@/lib/ios-open");
      if (kind === "open") openInNewTab(url);
      else await downloadUrl(url, fileName);
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        onClick={() => open("open")}
        disabled={!!busy}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
      >
        <ExternalLink className="h-3 w-3" /> {busy === "open" ? "Opening…" : "View original"}
      </button>
      <button
        onClick={() => open("download")}
        disabled={!!busy}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
      >
        {busy === "download" ? "Preparing…" : "Download"}
      </button>
    </div>
  );
}

function ExtractionLoader() {
  return (
    <div className="ext mt-4 w-full animate-fade-in">
      <style>{`
        @keyframes ext-pulse-doc { 0%,100%{transform:scale(1);} 50%{transform:scale(1.04);} }
        @keyframes ext-scan { 0%{top:14px;opacity:.7;} 100%{top:146px;opacity:0;} }
        @keyframes ext-row { from{opacity:0;transform:translateX(-8px);} to{opacity:1;transform:translateX(0);} }
        @keyframes ext-msg { 0%,18%{opacity:1;} 22%,100%{opacity:0;} }
        @keyframes ext-dot { 0%,80%,100%{transform:translateY(0);} 40%{transform:translateY(-5px);} }
        @keyframes ext-rise1 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{opacity:1;} 100%{transform:translate(-40px,-140px) scale(.5);opacity:0;} }
        @keyframes ext-rise2 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{opacity:1;} 100%{transform:translate(6px,-140px) scale(.5);opacity:0;} }
        @keyframes ext-rise3 { 0%{transform:translate(0,0) scale(1);opacity:1;} 70%{opacity:1;} 100%{transform:translate(45px,-140px) scale(.5);opacity:0;} }
        .ext .doc-pulse { animation: ext-pulse-doc 2s ease-in-out infinite; }
        .ext .scan { animation: ext-scan 2s linear infinite; }
        .ext .fi1 { animation: ext-rise1 2.4s ease-in-out infinite; animation-delay:.3s; }
        .ext .fi2 { animation: ext-rise2 2.4s ease-in-out infinite; animation-delay:1s; }
        .ext .fi3 { animation: ext-rise3 2.4s ease-in-out infinite; animation-delay:1.7s; }
        .ext .msg1 { animation: ext-msg 4.8s ease-in-out infinite; }
        .ext .msg2 { animation: ext-msg 4.8s ease-in-out infinite; animation-delay:1.2s; }
        .ext .msg3 { animation: ext-msg 4.8s ease-in-out infinite; animation-delay:2.4s; }
        .ext .msg4 { animation: ext-msg 4.8s ease-in-out infinite; animation-delay:3.6s; }
        .ext .d1 { animation: ext-dot 1.2s ease-in-out infinite; }
        .ext .d2 { animation: ext-dot 1.2s ease-in-out infinite; animation-delay:.2s; }
        .ext .d3 { animation: ext-dot 1.2s ease-in-out infinite; animation-delay:.4s; }
        .ext .r1 { animation: ext-row .5s ease forwards; animation-delay:.8s; opacity:0; }
        .ext .r2 { animation: ext-row .5s ease forwards; animation-delay:1.6s; opacity:0; }
        .ext .r3 { animation: ext-row .5s ease forwards; animation-delay:2.4s; opacity:0; }
        .ext .doc-line { height:7px; border-radius:4px; background:var(--border); opacity:.7; }
      `}</style>

      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex items-start justify-center gap-8">
          {/* Document */}
          <div className="relative flex flex-col items-center gap-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Your report</div>
            <div className="doc-pulse relative flex h-40 w-28 flex-col gap-1.5 overflow-hidden rounded-lg border border-border bg-card p-3">
              <div className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-primary">
                <FileText className="h-3 w-3 text-primary-foreground" />
              </div>
              <div className="mb-1 text-[9px] font-medium text-muted-foreground">Lab Report</div>
              <div className="doc-line" style={{ width: "95%" }} />
              <div className="doc-line" style={{ width: "80%" }} />
              <div className="doc-line" style={{ width: "55%" }} />
              <div className="doc-line" style={{ width: "95%" }} />
              <div className="doc-line" style={{ width: "80%" }} />
              <div className="doc-line" style={{ width: "55%" }} />
              <div className="doc-line" style={{ width: "95%" }} />
              <div className="scan absolute left-0 right-0 h-0.5 bg-primary/70" />
            </div>
            <div className="pointer-events-none absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-2.5">
              <div className="fi1 grid h-8 w-8 place-items-center rounded-lg border border-border bg-background">
                <FlaskConical className="h-4 w-4 text-primary" />
              </div>
              <div className="fi2 grid h-8 w-8 place-items-center rounded-lg border border-border bg-background">
                <Pill className="h-4 w-4 text-primary" />
              </div>
              <div className="fi3 grid h-8 w-8 place-items-center rounded-lg border border-border bg-background">
                <Stethoscope className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center pt-16">
            <div className="relative h-0.5 w-10 bg-border">
              <span className="absolute -right-1 -top-1 h-0 w-0 border-y-4 border-l-[7px] border-y-transparent border-l-border" />
            </div>
          </div>

          {/* Results */}
          <div className="flex w-44 flex-col gap-2 pt-11">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Clinical events</div>
            <div className="r1 flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
              <span className="text-[13px] font-medium">HbA1c</span>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800">6.4%</span>
            </div>
            <div className="r2 flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
              <span className="text-[13px] font-medium">LDL</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">118</span>
            </div>
            <div className="r3 flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
              <span className="text-[13px] font-medium">Vitamin D</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">42</span>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-col items-center gap-2">
          <div className="relative flex h-6 w-64 items-center justify-center">
            <span className="msg1 absolute text-sm text-muted-foreground">Reading your report…</span>
            <span className="msg2 absolute text-sm text-muted-foreground">Identifying clinical events…</span>
            <span className="msg3 absolute text-sm text-muted-foreground">Structuring your health data…</span>
            <span className="msg4 absolute text-sm text-muted-foreground">Almost done…</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="d1 h-1.5 w-1.5 rounded-full bg-primary/70" />
            <span className="d2 h-1.5 w-1.5 rounded-full bg-primary/70" />
            <span className="d3 h-1.5 w-1.5 rounded-full bg-primary/70" />
          </div>
        </div>
      </div>
    </div>
  );
}



function flagClass(f?: string) {
  switch (f) {
    case "high": return "bg-orange-100 text-orange-800";
    case "low": return "bg-blue-100 text-blue-800";
    case "critical": return "bg-red-100 text-red-800";
    case "normal": return "bg-green-100 text-green-800";
    default: return "bg-secondary text-muted-foreground";
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
