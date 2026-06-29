import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TABLES = [
  "profiles",
  "family_members",
  "consents",
  "documents",
  "extractions",
  "lab_results",
  "medications",
  "action_items",
  "summaries",
  "episodes",
  "notifications_log",
  "chat_threads",
  "chat_messages",
  "user_roles",
] as const;

export const exportMyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const out: Record<string, any> = {
      exported_at: new Date().toISOString(),
      user_id: context.userId,
    };
    const sb = context.supabase as any;
    for (const t of TABLES) {
      const col = t === "profiles" ? "id" : "user_id";
      const { data } = await sb.from(t).select("*").eq(col, context.userId);
      out[t] = data ?? [];
    }
    return out as Record<string, any>;
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    try {
      const { data: list } = await admin.storage
        .from("medical-documents")
        .list(context.userId, { limit: 1000 });
      const paths = (list ?? []).map((o: any) => `${context.userId}/${o.name}`);
      if (paths.length) await admin.storage.from("medical-documents").remove(paths);
    } catch (e) {
      console.error("storage wipe failed", e);
    }

    for (const t of TABLES) {
      try {
        const col = t === "profiles" ? "id" : "user_id";
        await admin.from(t).delete().eq(col, context.userId);
      } catch (e) {
        console.error("delete table", t, e);
      }
    }

    const { error } = await admin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
