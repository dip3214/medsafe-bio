import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyConsent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("consents")
      .select("id, storage_consent, ai_processing_consent, analytics_consent, accepted_at, updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const UpdateInput = z.object({
  storage_consent: z.boolean(),
  ai_processing_consent: z.boolean(),
  analytics_consent: z.boolean(),
});

export const upsertMyConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ context, data }) => {
    const { data: existing } = await context.supabase
      .from("consents")
      .select("id")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const payload = {
      user_id: context.userId,
      consent_type: "dpdp_v1",
      storage_consent: data.storage_consent,
      ai_processing_consent: data.ai_processing_consent,
      analytics_consent: data.analytics_consent,
      accepted_at: new Date().toISOString(),
    };
    if (existing?.id) {
      const { error } = await context.supabase.from("consents").update(payload).eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id };
    }
    const { data: row, error } = await context.supabase
      .from("consents")
      .insert(payload)
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message || "Failed");
    return { id: row.id as string };
  });
