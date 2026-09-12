import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Single rolling chat thread per (user, member). Sidebar/threads UI is removed,
 * but messages still persist silently so context survives reloads.
 */
export const getOrCreateChatThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().uuid().nullable().optional() }).parse(d))
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("chat_threads")
      .select("id")
      .eq("user_id", context.userId)
      .order("last_message_at", { ascending: false })
      .limit(1);
    q = data.memberId ? q.eq("member_id", data.memberId) : q.is("member_id", null);
    const { data: existing } = await q.maybeSingle();
    if (existing?.id) return { id: existing.id as string };

    const { data: row, error } = await context.supabase
      .from("chat_threads")
      .insert({ user_id: context.userId, member_id: data.memberId ?? null, title: "MedSafe Buddy" })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message || "Failed to start chat");
    return { id: row.id as string };
  });

export const getChatThreadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ threadId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("user_id", context.userId)
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id as string,
      role: r.role as "user" | "assistant" | "system",
      parts: [{ type: "text" as const, text: r.content as string }],
    }));
  });

export const clearChatThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ threadId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await context.supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", context.userId)
      .eq("thread_id", data.threadId);
    return { ok: true };
  });
