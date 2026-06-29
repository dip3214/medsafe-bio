import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Segment = z.enum(["kids", "parents", "me"]);

export const listFamilyMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("family_members")
      .select("id, name, segment, relation, dob, avatar_color, is_default, created_at")
      .eq("user_id", context.userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createFamilyMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(80),
        segment: Segment,
        relation: z.string().trim().max(40).optional(),
        dob: z.string().optional(),
        avatar_color: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("family_members")
      .insert({
        user_id: context.userId,
        name: data.name,
        segment: data.segment,
        relation: data.relation ?? null,
        dob: data.dob || null,
        avatar_color: data.avatar_color ?? null,
        is_default: false,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message || "Failed to add member");
    return { id: row.id as string };
  });

export const deleteFamilyMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: m } = await context.supabase
      .from("family_members")
      .select("is_default")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (m?.is_default) throw new Error("Cannot delete your default profile");
    const { error } = await context.supabase
      .from("family_members")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
