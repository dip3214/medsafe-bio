/**
 * Real RAG for MedBuddy Assistant.
 *
 * Documents are chunked into small, self-describing passages, embedded with
 * the Lovable AI Gateway embeddings endpoint (1536 dims) and stored in
 * public.doc_chunks. Retrieval is a cosine nearest-neighbour search through
 * the match_doc_chunks RPC, which runs as the caller so RLS keeps every
 * user inside their own records.
 */

const EMBED_URL = "https://ai.gateway.lovable.dev/v1/embeddings";
const EMBED_MODEL = "google/gemini-embedding-2";
const EMBED_DIMS = 1536;

export async function embedTexts(apiKey: string, inputs: string[]): Promise<number[][]> {
  const out: number[][] = [];
  // Google caps batches at 100 inputs per request.
  for (let i = 0; i < inputs.length; i += 50) {
    const batch = inputs.slice(i, i + 50);
    const res = await fetch(EMBED_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({ model: EMBED_MODEL, input: batch, dimensions: EMBED_DIMS }),
    });
    if (!res.ok) throw new Error(`Embedding failed (${res.status}): ${await res.text()}`);
    const json: any = await res.json();
    const sorted = [...(json.data ?? [])].sort((a: any, b: any) => a.index - b.index);
    for (const d of sorted) out.push(d.embedding as number[]);
  }
  return out;
}

type DocRow = {
  id: string;
  title: string | null;
  document_date: string | null;
  document_type: string | null;
  member_id: string | null;
  structured: any;
};

/** Turn one document into focused, human-readable passages. */
export function chunkDocument(doc: DocRow): { content: string; metadata: Record<string, unknown> }[] {
  const s = doc.structured ?? {};
  const head = `${(doc.document_type || "document").toUpperCase()} "${doc.title || "Untitled"}" dated ${doc.document_date || "unknown date"}${s.doctor ? `, by Dr. ${s.doctor}` : ""}${s.hospital ? ` at ${s.hospital}` : ""}${s.patientName ? `, patient ${s.patientName}` : ""}.`;
  const meta = {
    title: doc.title,
    date: doc.document_date,
    type: doc.document_type,
    doctor: s.doctor ?? null,
    hospital: s.hospital ?? null,
  };
  const chunks: { content: string; metadata: Record<string, unknown> }[] = [];
  const push = (body: string) => {
    const text = `${head}\n${body}`.trim();
    if (body.trim()) chunks.push({ content: text.slice(0, 4000), metadata: meta });
  };

  if (s.summary) push(`Summary: ${s.summary}`);
  if (Array.isArray(s.diagnoses) && s.diagnoses.length) push(`Diagnoses / findings: ${s.diagnoses.join(", ")}.`);
  if (Array.isArray(s.medicines) && s.medicines.length) {
    const lines = s.medicines.map(
      (m: any) =>
        `- ${m.name}${m.dose ? ` ${m.dose}` : ""}${m.frequency ? `, ${m.frequency}` : ""}${m.duration ? `, for ${m.duration}` : ""}`,
    );
    for (let i = 0; i < lines.length; i += 12) push(`Medicines prescribed:\n${lines.slice(i, i + 12).join("\n")}`);
  }
  if (Array.isArray(s.labValues) && s.labValues.length) {
    const lines = s.labValues.map(
      (l: any) =>
        `- ${l.name}: ${l.value}${l.unit ? ` ${l.unit}` : ""}${l.refRange ? ` (reference ${l.refRange})` : ""}${l.flag && l.flag !== "normal" ? ` — ${String(l.flag).toUpperCase()}` : " — normal"}`,
    );
    for (let i = 0; i < lines.length; i += 12) push(`Lab values:\n${lines.slice(i, i + 12).join("\n")}`);
  }
  if (s.notes) push(`Notes: ${s.notes}`);
  if (!chunks.length) push(`No structured details were extracted from this document.`);
  return chunks;
}

/** Embed + store chunks for one document. Safe to call repeatedly (replaces). */
export async function indexDocument(
  supabase: any,
  apiKey: string,
  userId: string,
  doc: DocRow,
): Promise<number> {
  const chunks = chunkDocument(doc);
  if (!chunks.length) return 0;
  const vectors = await embedTexts(apiKey, chunks.map((c) => c.content));
  await supabase.from("doc_chunks").delete().eq("document_id", doc.id).eq("user_id", userId);
  const rows = chunks.map((c, i) => ({
    user_id: userId,
    member_id: doc.member_id,
    document_id: doc.id,
    chunk_index: i,
    content: c.content,
    metadata: c.metadata,
    embedding: JSON.stringify(vectors[i]),
  }));
  const { error } = await supabase.from("doc_chunks").insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}

/**
 * Lazily index any document that has no chunks yet (covers everything
 * uploaded before RAG existed). Bounded so chat latency stays sane.
 */
export async function backfillMissing(
  supabase: any,
  apiKey: string,
  userId: string,
  memberId: string | null,
  limit = 6,
): Promise<number> {
  let q = supabase
    .from("documents")
    .select("id, title, document_date, document_type, member_id, extractions(structured_data)")
    .eq("user_id", userId)
    .order("document_date", { ascending: false })
    .limit(60);
  if (memberId) q = q.eq("member_id", memberId);
  const { data: docs } = await q;
  if (!docs?.length) return 0;

  const { data: indexed } = await supabase
    .from("doc_chunks")
    .select("document_id")
    .eq("user_id", userId)
    .in("document_id", docs.map((d: any) => d.id));
  const done = new Set((indexed ?? []).map((r: any) => r.document_id));

  let count = 0;
  for (const d of docs as any[]) {
    if (done.has(d.id) || count >= limit) continue;
    try {
      await indexDocument(supabase, apiKey, userId, {
        id: d.id,
        title: d.title,
        document_date: d.document_date,
        document_type: d.document_type,
        member_id: d.member_id,
        structured: d.extractions?.[0]?.structured_data ?? {},
      });
      count++;
    } catch (e) {
      console.error("index failed", d.id, e);
    }
  }
  return count;
}

export type Retrieved = {
  documentId: string;
  content: string;
  metadata: any;
  similarity: number;
};

/** Semantic search over the user's own chunks. */
export async function retrieve(
  supabase: any,
  apiKey: string,
  query: string,
  memberId: string | null,
  matchCount = 10,
): Promise<Retrieved[]> {
  const [vec] = await embedTexts(apiKey, [query]);
  const { data, error } = await supabase.rpc("match_doc_chunks", {
    query_embedding: JSON.stringify(vec),
    match_count: matchCount,
    p_member_id: memberId,
  });
  if (error) {
    console.error("match_doc_chunks error", error);
    return [];
  }
  return (data ?? [])
    .filter((r: any) => r.similarity >= 0.25)
    .map((r: any) => ({
      documentId: r.document_id,
      content: r.content,
      metadata: r.metadata,
      similarity: r.similarity,
    }));
}
