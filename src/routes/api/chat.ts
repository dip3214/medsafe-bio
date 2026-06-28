import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        const url = process.env.SUPABASE_URL;
        const pub = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!apiKey || !url || !pub) return new Response("Misconfigured", { status: 500 });

        const authHeader = request.headers.get("authorization") ?? "";
        if (!authHeader.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const token = authHeader.slice(7);

        const body = (await request.json()) as { messages?: UIMessage[]; threadId?: string };
        if (!Array.isArray(body.messages)) return new Response("Bad request", { status: 400 });

        const supabase = createClient<Database>(url, pub, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
        if (claimsErr || !claims?.claims?.sub) return new Response("Unauthorized", { status: 401 });
        const userId = claims.claims.sub as string;

        // Build MedSafe clinical context for this user
        const { data: docs } = await supabase
          .from("documents")
          .select("title, document_date, document_type, extractions(structured_data)")
          .eq("user_id", userId)
          .order("document_date", { ascending: false })
          .limit(40);

        const contextLines: string[] = [];
        for (const d of docs ?? []) {
          const s: any = (d as any).extractions?.[0]?.structured_data ?? {};
          contextLines.push(
            `\n— ${d.document_type?.toUpperCase() ?? "DOC"} · ${d.document_date ?? "n/a"} · ${d.title ?? "Untitled"}` +
              (s.doctor ? ` · Dr. ${s.doctor}` : "") +
              (s.hospital ? ` · ${s.hospital}` : ""),
          );
          if (s.summary) contextLines.push(`  Summary: ${String(s.summary).slice(0, 300)}`);
          if (Array.isArray(s.diagnoses) && s.diagnoses.length)
            contextLines.push(`  Diagnoses: ${s.diagnoses.join(", ")}`);
          if (Array.isArray(s.medicines) && s.medicines.length)
            contextLines.push(
              `  Medicines: ${s.medicines
                .map((m: any) => `${m.name}${m.dose ? ` ${m.dose}` : ""}${m.frequency ? ` ${m.frequency}` : ""}`)
                .join("; ")}`,
            );
          if (Array.isArray(s.labValues) && s.labValues.length)
            contextLines.push(
              `  Labs: ${s.labValues
                .map(
                  (l: any) =>
                    `${l.name}=${l.value}${l.unit ? ` ${l.unit}` : ""}${l.flag && l.flag !== "normal" ? ` [${l.flag}]` : ""}${l.refRange ? ` (ref ${l.refRange})` : ""}`,
                )
                .join("; ")}`,
            );
        }
        const contextBlock = contextLines.length
          ? contextLines.join("\n")
          : "(no documents uploaded yet)";

        const system = `You are MedSafe Assistant — a careful, India-aware clinical companion for a patient using the MedSafe app.
You have access to the patient's structured medical records below, parsed from their uploaded prescriptions and lab reports.
Always ground your answers in this data; quote specific dates, values, and medicines when relevant. If the records don't contain the answer, say so plainly.
Use INR for costs and DD/MM/YYYY for dates. Be warm, concise, and structured (short paragraphs, bullets when helpful). Use Markdown.
You are NOT a doctor — for anything urgent or treatment-changing, recommend consulting their physician.

=== PATIENT RECORDS (most recent first) ===${contextBlock}
=== END RECORDS ===`;

        const gateway = createLovableAiGatewayProvider(apiKey);
        const result = streamText({
          model: gateway("google/gemini-2.5-flash"),
          system,
          messages: await convertToModelMessages(body.messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages,
          onFinish: async ({ messages }) => {
            const threadId = body.threadId;
            if (!threadId) return;
            const last = messages[messages.length - 1];
            const user = body.messages[body.messages.length - 1];
            const text = (m: UIMessage) =>
              (m.parts ?? [])
                .map((p: any) => (p.type === "text" ? p.text : ""))
                .join("")
                .trim();
            try {
              if (user?.role === "user") {
                await supabase.from("chat_messages").insert({
                  user_id: userId,
                  thread_id: threadId,
                  conversation_id: threadId,
                  role: "user",
                  content: text(user),
                });
              }
              if (last?.role === "assistant") {
                await supabase.from("chat_messages").insert({
                  user_id: userId,
                  thread_id: threadId,
                  conversation_id: threadId,
                  role: "assistant",
                  content: text(last),
                });
              }
              await supabase
                .from("chat_threads")
                .update({ last_message_at: new Date().toISOString() })
                .eq("id", threadId)
                .eq("user_id", userId);
            } catch (e) {
              console.error("persist chat error", e);
            }
          },
        });
      },
    },
  },
});
