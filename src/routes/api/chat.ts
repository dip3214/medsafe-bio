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

        const body = (await request.json()) as { messages?: UIMessage[]; threadId?: string; memberId?: string };
        const messages = body.messages;
        if (!Array.isArray(messages)) return new Response("Bad request", { status: 400 });

        const supabase = createClient<Database>(url, pub, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
        if (claimsErr || !claims?.claims?.sub) return new Response("Unauthorized", { status: 401 });
        const userId = claims.claims.sub as string;

        // Resolve active member (passed) and load their context
        let memberLabel = "the patient";
        if (body.memberId) {
          const { data: m } = await supabase
            .from("family_members")
            .select("name, relation, segment")
            .eq("id", body.memberId)
            .eq("user_id", userId)
            .maybeSingle();
          if (m) memberLabel = `${m.name}${m.relation ? ` (${m.relation})` : ""}`;
        }

        let q = supabase
          .from("documents")
          .select("title, document_date, document_type, extractions(structured_data)")
          .eq("user_id", userId)
          .order("document_date", { ascending: false })
          .limit(40);
        if (body.memberId) q = q.eq("member_id", body.memberId);
        const { data: docs } = await q;

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
        const contextBlock = contextLines.length ? contextLines.join("\n") : "(no documents uploaded yet)";

        // Lifestyle context — recent daily logs for this account. Available
        // regardless of segment so a user can ask "how have I been sleeping?"
        const { data: lsLogs } = await supabase
          .from("lifestyle_logs")
          .select("log_date, sleep_hours, exercise_type, exercise_minutes, meals")
          .eq("user_id", userId)
          .order("log_date", { ascending: false })
          .limit(14);
        const lsBlock = (lsLogs ?? [])
          .map(
            (l: any) =>
              `- ${l.log_date}: sleep ${l.sleep_hours ?? "—"}h · ${l.exercise_type ?? "no movement"} ${l.exercise_minutes ?? 0}min${l.meals ? ` · meals: ${String(l.meals).slice(0, 120)}` : ""}`,
          )
          .join("\n") || "(no lifestyle logs yet)";

        const system = `You are MedSafe Assistant — a careful, India-aware clinical companion answering questions about ${memberLabel}.
You have access to ${memberLabel}'s structured medical records and daily lifestyle logs below.
Always ground your answers in this data; quote specific dates, values, and medicines when relevant. If the records don't contain the answer, say so plainly.
When the user shares a lifestyle update in natural language (e.g. "slept 6.5 hours", "went for a 20 min run"), acknowledge warmly and note that the Lifestyle tab captures these automatically.
Use INR for costs and DD/MM/YYYY for dates. Be warm, concise, and structured. Use Markdown.
You are NOT a doctor — for anything urgent or treatment-changing, recommend consulting their physician.

=== ${memberLabel.toUpperCase()}'S RECORDS (most recent first) ===${contextBlock}
=== END RECORDS ===

=== LIFESTYLE LOGS (last 14 days) ===
${lsBlock}
=== END LIFESTYLE ===`;

        const gateway = createLovableAiGatewayProvider(apiKey);
        const result = streamText({
          model: gateway("google/gemini-2.5-flash"),
          system,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            const threadId = body.threadId;
            if (!threadId) return;
            const last = finalMessages[finalMessages.length - 1];
            const user = messages[messages.length - 1];
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
