import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/SiteLayout";

const unsubscribe = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("email_preferences")
      .update({ weekly_enabled: false })
      .eq("unsubscribe_token", data.token);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (s: Record<string, unknown>) => ({ token: String(s.token ?? "") }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const { token } = useSearch({ from: "/unsubscribe" });
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    if (!token) { setState("error"); return; }
    unsubscribe({ data: { token } })
      .then(() => setState("ok"))
      .catch(() => setState("error"));
  }, [token]);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl">MedSafe email preferences</h1>
        <p className="mt-4 text-muted-foreground">
          {state === "loading" && "Updating your preferences…"}
          {state === "ok" && "You've been unsubscribed from weekly check-ins. You can re-enable them any time from your account settings."}
          {state === "error" && "That link looks invalid or has already been used."}
        </p>
      </section>
    </SiteLayout>
  );
}
