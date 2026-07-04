import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const UpsertLog = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sleep_hours: z.number().min(0).max(24).nullable().optional(),
  exercise_type: z.string().max(40).nullable().optional(),
  exercise_minutes: z.number().int().min(0).max(1440).nullable().optional(),
  meals: z.string().max(2000).nullable().optional(),
  source: z.enum(["form", "chat"]).default("form"),
});

export const upsertLifestyleLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertLog.parse(d))
  .handler(async ({ context, data }) => {
    const log_date = data.log_date ?? new Date().toISOString().slice(0, 10);
    const { data: existing } = await context.supabase
      .from("lifestyle_logs")
      .select("id, sleep_hours, exercise_type, exercise_minutes, meals")
      .eq("user_id", context.userId)
      .eq("log_date", log_date)
      .maybeSingle();

    const payload = {
      user_id: context.userId,
      log_date,
      sleep_hours: data.sleep_hours ?? existing?.sleep_hours ?? null,
      exercise_type: data.exercise_type ?? existing?.exercise_type ?? null,
      exercise_minutes: data.exercise_minutes ?? existing?.exercise_minutes ?? null,
      meals: data.meals ?? existing?.meals ?? null,
      source: data.source,
    };
    const { error } = await context.supabase
      .from("lifestyle_logs")
      .upsert(payload, { onConflict: "user_id,log_date" });
    if (error) throw new Error(error.message);
    return { ok: true, log_date };
  });

export const listLifestyleLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ days: z.number().int().min(1).max(180).default(30) }).parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const since = new Date(Date.now() - data.days * 86400_000).toISOString().slice(0, 10);
    const { data: rows, error } = await context.supabase
      .from("lifestyle_logs")
      .select("log_date, sleep_hours, exercise_type, exercise_minutes, meals")
      .eq("user_id", context.userId)
      .gte("log_date", since)
      .order("log_date", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getLifestyleGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("lifestyle_goals")
      .select("sleep_hours_target, exercise_min_per_day, exercise_days_per_week")
      .eq("user_id", context.userId)
      .maybeSingle();
    return (
      data ?? { sleep_hours_target: 7.5, exercise_min_per_day: 30, exercise_days_per_week: 5 }
    );
  });

export const upsertLifestyleGoals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        sleep_hours_target: z.number().min(1).max(14),
        exercise_min_per_day: z.number().int().min(0).max(240),
        exercise_days_per_week: z.number().int().min(0).max(7),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("lifestyle_goals")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Parse natural-language lifestyle update via Gemini and upsert.
const ParseInput = z.object({ text: z.string().min(2).max(500) });
export const parseLifestyleUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ParseInput.parse(d))
  .handler(async ({ context, data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const { generateText, Output } = await import("ai");
    const gateway = createLovableAiGatewayProvider(key);
    const today = new Date().toISOString().slice(0, 10);
    const { output } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      output: Output.object({
        schema: z.object({
          sleep_hours: z.number().min(0).max(24).nullable(),
          exercise_type: z.enum(["walk", "run", "yoga", "gym", "other"]).nullable(),
          exercise_minutes: z.number().int().min(0).max(1440).nullable(),
          meals: z.string().nullable(),
          note: z.string(),
        }),
      }),
      prompt: `Extract lifestyle fields from this note (today is ${today}). Return nulls when not mentioned. Note: """${data.text}"""`,
    });
    const parsed = output as any;
    await context.supabase
      .from("lifestyle_logs")
      .upsert(
        {
          user_id: context.userId,
          log_date: today,
          sleep_hours: parsed.sleep_hours,
          exercise_type: parsed.exercise_type,
          exercise_minutes: parsed.exercise_minutes,
          meals: parsed.meals,
          source: "chat",
        },
        { onConflict: "user_id,log_date" },
      );
    return parsed;
  });

// Estimate calories & items from a meal photo (Gemini vision).
const EstimateInput = z.object({
  imageDataUrl: z.string().min(20),
  mimeType: z.string(),
});
export const estimateMealCalories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EstimateInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a friendly Indian nutrition assistant. Given a meal photo, estimate items and total kcal. Reply in <=2 short sentences, e.g. 'Looks like dal, rice and sabzi — about 550 kcal.'" },
          {
            role: "user",
            content: [
              { type: "text", text: "Estimate calories for this meal." },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      if (resp.status === 429) throw new Error("AI rate limit. Try again shortly.");
      if (resp.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`Vision failed: ${resp.status} ${txt.slice(0, 200)}`);
    }
    const json = await resp.json();
    const text: string = json?.choices?.[0]?.message?.content?.trim() ?? "";
    return { text };
  });
