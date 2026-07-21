import { createFileRoute } from "@tanstack/react-router";
import { sendWeeklyCheckInEmails } from "@/lib/weekly-email.server";

// pg_cron hits this every weekday morning; the handler decides whether it's
// a Monday "let's go" or Saturday "how did it feel" email, and no-ops otherwise.
// Called from Supabase pg_cron with the anon apikey header (public prefix
// bypasses auth); Resend key + Supabase service role live server-side.
export const Route = createFileRoute("/api/public/cron/weekly-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const override = url.searchParams.get("cadence");
        const day = new Date().getUTCDay(); // 0 Sun … 6 Sat
        const cadence = override === "monday" || override === "saturday"
          ? (override as "monday" | "saturday")
          : day === 1 ? "monday" : day === 6 ? "saturday" : null;
        if (!cadence) {
          return Response.json({ skipped: true, day });
        }
        try {
          const summary = await sendWeeklyCheckInEmails(cadence);
          return Response.json({ ok: true, ...summary });
        } catch (e: any) {
          console.error("[weekly-email] failed", e);
          return Response.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
        }
      },
    },
  },
});
