import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ParsedSchema = z.object({
  kind: z.enum(["report", "prescription"]).default("report"),
  title: z.string().default("Medical document"),
  date: z.string().default(""),
  doctor: z.string().nullable().optional(),
  hospital: z.string().nullable().optional(),
  patientName: z.string().nullable().optional(),
  patientAge: z.string().nullable().optional(),
  patientGender: z.string().nullable().optional(),
  summary: z.string().optional().default(""),
  diagnoses: z.array(z.string()).optional().default([]),
  medicines: z
    .array(
      z.object({
        name: z.string(),
        dose: z.string().optional().default(""),
        frequency: z.string().optional().default(""),
        duration: z.string().optional().default(""),
      }),
    )
    .optional()
    .default([]),
  labValues: z
    .array(
      z.object({
        name: z.string(),
        value: z.union([z.string(), z.number()]),
        unit: z.string().nullish().transform((v) => v ?? ""),
        refRange: z.string().nullish().transform((v) => v ?? ""),
        flag: z.enum(["normal", "high", "low", "critical"]).nullish().transform((v) => v ?? undefined),
      }),
    )
    .optional()
    .default([]),
  notes: z.string().optional().default(""),
});

const CreateInput = z.object({
  storagePath: z.string().min(1),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.number().optional(),
  memberId: z.string().uuid().optional(),
  parsed: ParsedSchema,
});

const ListInput = z.object({ memberId: z.string().uuid().optional() }).optional();

export const listMedicalDocs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d) ?? {})
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("documents")
      .select(
        "id, title, document_date, document_type, storage_path, mime_type, file_size_bytes, member_id, created_at, extractions(structured_data)",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (data?.memberId) q = q.eq("member_id", data.memberId);
    const { data: docs, error } = await q;
    if (error) throw new Error(error.message);
    return (docs || []).map((d: any) => {
      const s = d.extractions?.[0]?.structured_data || {};
      return {
        id: d.id,
        kind: (s.kind === "prescription" ? "prescription" : "report") as "report" | "prescription",
        title: d.title,
        date: d.document_date || (d.created_at || "").slice(0, 10),
        doctor: s.doctor || undefined,
        hospital: s.hospital || undefined,
        patientName: s.patientName || undefined,
        patientAge: s.patientAge || undefined,
        patientGender: s.patientGender || undefined,
        summary: s.summary || "",
        diagnoses: s.diagnoses || [],
        medicines: s.medicines || [],
        labValues: s.labValues || [],
        notes: s.notes || "",
        fileName: s.fileName || d.title,
        storagePath: d.storage_path,
        memberId: d.member_id || undefined,
        createdAt: d.created_at,
      };
    });
  });

export const createMedicalDoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ context, data }) => {
    const p = data.parsed;
    const docDate = p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : new Date().toISOString().slice(0, 10);

    // Resolve member: explicit > default
    let memberId = data.memberId;
    if (!memberId) {
      const { data: def } = await context.supabase
        .from("family_members")
        .select("id")
        .eq("user_id", context.userId)
        .eq("is_default", true)
        .maybeSingle();
      memberId = def?.id ?? undefined;
    }

    const { data: doc, error: docErr } = await context.supabase
      .from("documents")
      .insert({
        user_id: context.userId,
        member_id: memberId ?? null,
        title: p.title || data.fileName,
        document_date: docDate,
        document_type: p.kind,
        storage_path: data.storagePath,
        mime_type: data.mimeType,
        file_size_bytes: data.fileSize ?? null,
        processing_status: "completed",
      })
      .select("id")
      .single();
    if (docErr || !doc) throw new Error(docErr?.message || "Failed to save document");

    const { error: exErr } = await context.supabase.from("extractions").insert({
      user_id: context.userId,
      member_id: memberId ?? null,
      document_id: doc.id,
      extraction_type: p.kind,
      model_name: "google/gemini-2.5-flash",
      structured_data: { ...p, fileName: data.fileName },
    });
    if (exErr) throw new Error(exErr.message);
    return { id: doc.id };
  });

export const deleteMedicalDoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: doc } = await context.supabase
      .from("documents")
      .select("storage_path")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (doc?.storage_path) {
      await context.supabase.storage.from("medical-documents").remove([doc.storage_path]);
    }
    await context.supabase.from("extractions").delete().eq("document_id", data.id).eq("user_id", context.userId);
    const { error } = await context.supabase.from("documents").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Latest flagged lab values for the landing page card
export const listFlaggedLatest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().uuid().optional() }).optional().parse(d) ?? {})
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("documents")
      .select("id, title, document_date, member_id, extractions(structured_data)")
      .eq("user_id", context.userId)
      .order("document_date", { ascending: false })
      .limit(10);
    if (data?.memberId) q = q.eq("member_id", data.memberId);
    const { data: rows } = await q;
    const out: { name: string; value: string; unit: string; refRange: string; flag: string; date: string; doc: string }[] = [];
    for (const d of rows ?? []) {
      const s: any = (d as any).extractions?.[0]?.structured_data ?? {};
      for (const v of s.labValues ?? []) {
        if (v.flag && v.flag !== "normal") {
          out.push({
            name: v.name,
            value: String(v.value ?? ""),
            unit: v.unit ?? "",
            refRange: v.refRange ?? "",
            flag: v.flag,
            date: d.document_date ?? "",
            doc: d.title ?? "",
          });
        }
      }
      if (out.length >= 5) break;
    }
    return out.slice(0, 3);
  });

// Signed URL for the ORIGINAL uploaded file. The extracted data is a
// convenience layer — the original document is the source of truth and must
// always be one click away from anywhere it's referenced.
export const getDocumentSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ documentId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: doc, error } = await context.supabase
      .from("documents")
      .select("storage_path, member_id, user_id")
      .eq("id", data.documentId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error || !doc?.storage_path) throw new Error("Document not found");
    const { data: signed, error: sErr } = await context.supabase.storage
      .from("medical-documents")
      .createSignedUrl(doc.storage_path, 60 * 5);
    if (sErr || !signed) throw new Error(sErr?.message || "Could not sign URL");
    return { url: signed.signedUrl };
  });
