import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { extractClinicalDoc } from "@/lib/extract.functions";
import { createMedicalDoc, deleteMedicalDoc, listMedicalDocs } from "@/lib/medsafe.functions";
import { groupDocs } from "@/lib/medsafe-types";
import type { MedicalDoc } from "@/lib/medsafe-types";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Loader2, Pill, FlaskConical, Stethoscope, CalendarDays, Trash2, AlertTriangle, UserRound } from "lucide-react";
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
      <section className="mx-auto max-w-6xl px-4 py-10">
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
              {busy ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Extracting & uploading…</span> : "Choose file"}
              <input type="file" accept="image/*,application/pdf" className="hidden" disabled={busy}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
            </label>
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
      {d.storagePath && (
        <div className="mt-3 text-xs text-muted-foreground">
          <FileText className="-mt-0.5 mr-1 inline h-3 w-3" />Stored at {d.storagePath.split("/").pop()}
        </div>
      )}
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
