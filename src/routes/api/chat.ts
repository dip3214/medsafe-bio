import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { backfillMissing, retrieve } from "@/lib/rag.server";
import { GUARDRAIL_RULES, screenUserMessage } from "@/lib/guardrails";

const textOf = (m: UIMessage) =>
  (m?.parts ?? [])
    .map((p: any) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();

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

        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        const question = textOf(lastUser as UIMessage);

        const persist = async (role: "user" | "assistant", content: string) => {
          if (!body.threadId || !content) return;
          try {
            await supabase.from("chat_messages").insert({
              user_id: userId,
              thread_id: body.threadId,
              conversation_id: body.threadId,
              role,
              content,
            });
            await supabase
              .from("chat_threads")
              .update({ last_message_at: new Date().toISOString() })
              .eq("id", body.threadId)
              .eq("user_id", userId);
          } catch (e) {
            console.error("persist chat error", e);
          }
        };

        // ---------- Guardrail layer 1 & 2: screen before any model call ----------
        const guard = screenUserMessage(question);
        if (guard.kind !== "ok") {
          await persist("user", question);
          await persist("assistant", guard.reply);
          const stream = createUIMessageStream({
            execute: async ({ writer }) => {
              const id = "guard-1";
              writer.write({ type: "text-start", id });
              writer.write({ type: "text-delta", id, delta: guard.reply });
              writer.write({ type: "text-end", id });
            },
          });
          return createUIMessageStreamResponse({ stream });
        }

        // ---------- Who are we talking about ----------
        const memberId = body.memberId ?? null;
        let memberLabel = "you";
        if (memberId) {
          const { data: m } = await supabase
            .from("family_members")
            .select("name, relation")
            .eq("id", memberId)
            .eq("user_id", userId)
            .maybeSingle();
          if (m) memberLabel = `${m.name}${m.relation ? ` (${m.relation})` : ""}`;
        }

        // ---------- RAG: make sure everything is indexed, then retrieve ----------
        try {
          await backfillMissing(supabase, apiKey, userId, memberId);
        } catch (e) {
          console.error("backfill error", e);
        }

        let hits: Awaited<ReturnType<typeof retrieve>> = [];
        try {
          hits = await retrieve(supabase, apiKey, question, memberId, 10);
        } catch (e) {
          console.error("retrieval error", e);
        }

        const fmtDate = (d?: string | null) => {
          if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return d || "date unknown";
          const [y, mo, da] = d.split("-");
          return `${da}/${mo}/${y}`;
        };

        const retrievedBlock = hits.length
          ? hits
              .map(
                (h, i) =>
                  `[${i + 1}] ${h.metadata?.title || "Document"} · ${fmtDate(h.metadata?.date)} (relevance ${(h.similarity * 100).toFixed(0)}%)\n${h.content}`,
              )
              .join("\n\n")
          : "(nothing in the records matched this question)";

        // A light index of what exists, so MedBuddy can say "you have 3 reports"
        let idxQ = supabase
          .from("documents")
          .select("title, document_date, document_type")
          .eq("user_id", userId)
          .order("document_date", { ascending: false })
          .limit(25);
        if (memberId) idxQ = idxQ.eq("member_id", memberId);
        const { data: idx } = await idxQ;
        const indexBlock =
          (idx ?? []).map((d: any) => `- ${d.document_type ?? "doc"} · ${fmtDate(d.document_date)} · ${d.title}`).join("\n") ||
          "(no documents uploaded yet)";

        // ---------- Lifestyle context ----------
        const { data: lsLogs } = await supabase
          .from("lifestyle_logs")
          .select("log_date, sleep_hours, exercise_type, exercise_minutes, meals, mood")
          .eq("user_id", userId)
          .order("log_date", { ascending: false })
          .limit(14);
        const lsBlock =
          (lsLogs ?? [])
            .map(
              (l: any) =>
                `- ${fmtDate(l.log_date)}: sleep ${l.sleep_hours ?? "—"}h · ${l.exercise_type ?? "no movement"} ${l.exercise_minutes ?? 0}min${l.mood ? ` · mood ${l.mood}/5` : ""}${l.meals ? ` · meals: ${String(l.meals).slice(0, 120)}` : ""}`,
            )
            .join("\n") || "(no lifestyle logs yet)";

        const system = `You are **MedBuddy Assistant** — a warm, India-aware health companion. You are talking about ${memberLabel}'s health.

Voice: friendly, plain-spoken, concise. Short paragraphs and Markdown. Explain the "why" (what HbA1c actually measures, why LDL matters, how sleep affects recovery) so the person understands, not just obeys. No jargon walls, no compliance-bot disclaimers on ordinary wellness questions.

Always end a records-based answer with a short "**From:** <document title>, DD/MM/YYYY" line naming the documents you used.

${GUARDRAIL_RULES}

=== RETRIEVED RECORDS (semantic search over ${memberLabel}'s uploads, most relevant first) ===
${retrievedBlock}
=== END RETRIEVED RECORDS ===

=== ALL DOCUMENTS ON FILE (titles only — do not quote values from here) ===
${indexBlock}
=== END DOCUMENT LIST ===

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
            const last = finalMessages[finalMessages.length - 1];
            await persist("user", question);
            if (last?.role === "assistant") await persist("assistant", textOf(last));
          },
        });
      },
    },
  },
});
