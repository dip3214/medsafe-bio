// One-off admin: send MedSafe weekly check-in emails to opted-in users.
// Runs in Supabase Edge Functions so it can read the auto-injected
// SUPABASE_SERVICE_ROLE_KEY and RESEND_API_KEY without extra wiring.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const APP_URL = "https://med-safe.live";
const FROM = "MedSafe <hello@med-safe.live>";
const BRAND = "#a83318";

type Cadence = "monday" | "saturday";

function renderEmail(cadence: Cadence, name: string | null, token: string) {
  const first = (name || "there").split(" ")[0];
  const monday = {
    hero: "A fresh week — small habits, big wins",
    body: `Hi ${first}, it's Monday. A tiny check-in now sets up a healthier week ahead. Take 30 seconds to log how you slept, what you ate for breakfast, and one thing you'll do for your body today.`,
    cta: "Log today's check-in",
  };
  const saturday = {
    hero: "How did your body feel this week?",
    body: `Hi ${first}, weekend reflection time. Which day felt best? Any headaches, poor sleep, meals you'd change? A short log helps MedSafe surface patterns before they turn into problems.`,
    cta: "Reflect on this week",
  };
  const copy = cadence === "monday" ? monday : saturday;
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#faf6f2;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:#1a1a1a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f2;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.06)">
        <tr><td style="padding:24px 28px 8px;border-bottom:1px solid #eee">
          <table role="presentation"><tr>
            <td style="vertical-align:middle">
              <div style="width:40px;height:40px;border-radius:12px;background:${BRAND};display:inline-block;text-align:center;vertical-align:middle;line-height:0">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;margin-top:9px">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>
                  <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
                </svg>
              </div>
            </td>
            <td style="vertical-align:middle;padding-left:12px">
              <div style="font-weight:600;font-size:19px;letter-spacing:-0.3px;color:#1a1a1a">med<span style="color:${BRAND};font-weight:700">Safe</span></div>
              <div style="font-size:10px;color:#888;letter-spacing:0.6px;text-transform:uppercase;margin-top:2px">One family · one health record</div>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:28px">
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:#1a1a1a">${copy.hero}</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#333">${copy.body}</p>
          <a href="${APP_URL}/lifestyle" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:15px">${copy.cta} →</a>
          <table role="presentation" width="100%" style="margin-top:28px;border-top:1px solid #eee;padding-top:20px">
            <tr>
              <td style="width:33%;vertical-align:top;padding-right:8px">
                <div style="font-size:22px">🥗</div>
                <div style="font-weight:600;font-size:13px;margin-top:4px">Meals</div>
                <div style="font-size:12px;color:#666">Snap a photo, we estimate calories.</div>
              </td>
              <td style="width:33%;vertical-align:top;padding:0 8px">
                <div style="font-size:22px">🎙️</div>
                <div style="font-weight:600;font-size:13px;margin-top:4px">Voice log</div>
                <div style="font-size:12px;color:#666">Speak how you feel — we transcribe.</div>
              </td>
              <td style="width:33%;vertical-align:top;padding-left:8px">
                <div style="font-size:22px">📈</div>
                <div style="font-weight:600;font-size:13px;margin-top:4px">Patterns</div>
                <div style="font-size:12px;color:#666">See what actually moves your labs.</div>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:18px 28px;background:#faf6f2;font-size:11px;color:#888;text-align:center">
          You're getting this because you opted into MedSafe weekly check-ins.<br>
          <a href="${APP_URL}/unsubscribe?token=${token}" style="color:#888">Unsubscribe</a> ·
          <a href="${APP_URL}" style="color:#888">Open MedSafe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const cadence = (url.searchParams.get("cadence") === "saturday" ? "saturday" : "monday") as Cadence;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ ok: false, error: "missing env" }), { status: 500 });
    }
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const today = new Date().toISOString().slice(0, 10);
    const { data: prefs, error } = await admin
      .from("email_preferences")
      .select("user_id, weekly_enabled, unsubscribe_token, last_sent_at")
      .eq("weekly_enabled", true);
    if (error) throw error;

    const results: { email: string; ok: boolean; err?: string }[] = [];
    for (const p of prefs ?? []) {
      if (p.last_sent_at && String(p.last_sent_at).slice(0, 10) === today) continue;
      const { data: u } = await admin.auth.admin.getUserById(p.user_id);
      const email = u?.user?.email;
      if (!email) continue;
      const name = (u.user!.user_metadata?.full_name || u.user!.user_metadata?.name || null) as string | null;
      const html = renderEmail(cadence, name, p.unsubscribe_token);
      const subject = cadence === "monday"
        ? "Let's make this a healthy week 💛"
        : "How did your week feel? A quick MedSafe check-in";
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: FROM,
            to: [email],
            subject,
            html,
            headers: { "List-Unsubscribe": `<${APP_URL}/unsubscribe?token=${p.unsubscribe_token}>` },
          }),
        });
        if (!res.ok) {
          const t = await res.text();
          results.push({ email, ok: false, err: `${res.status} ${t}` });
          continue;
        }
        await admin.from("email_preferences").update({ last_sent_at: new Date().toISOString() }).eq("user_id", p.user_id);
        results.push({ email, ok: true });
      } catch (e) {
        results.push({ email, ok: false, err: String((e as Error).message ?? e) });
      }
    }
    return new Response(JSON.stringify({ ok: true, cadence, total: (prefs ?? []).length, sent: results.filter(r => r.ok).length, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message ?? e) }), { status: 500 });
  }
});
