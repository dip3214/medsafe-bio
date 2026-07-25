// One-off admin: send MedSafe weekly check-in emails to opted-in users.
// Runs in Supabase Edge Functions so it can read the auto-injected
// SUPABASE_SERVICE_ROLE_KEY and RESEND_API_KEY without extra wiring.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const APP_URL = "https://med-safe.live";
const LOGO_URL = `${APP_URL}/medsafe-logo.png`;
const FROM = "MedSafe <hello@med-safe.live>";
const BRAND = "#a83318";
const INK = "#1f1a17";
const MUTED = "#7d726b";
const CREAM = "#faf6f2";

type Cadence = "monday" | "saturday";

const COPY: Record<Cadence, {
  preheader: string;
  kicker: string;
  hero: string;
  body: string;
  cta: string;
  prompts: { icon: string; title: string; text: string }[];
}> = {
  monday: {
    preheader: "Three tiny logs beat one big one. Start the week right.",
    kicker: "Monday reset",
    hero: "A fresh week — small habits, big wins",
    body: "It's Monday. A 30-second check-in now sets the tone for the whole week. Log how you slept, what you ate for breakfast, and one thing you'll do for your body today.",
    cta: "Log today's check-in",
    prompts: [
      { icon: "🌙", title: "Sleep", text: "How many hours did you actually get?" },
      { icon: "🥗", title: "Breakfast", text: "Snap it — we estimate the calories." },
      { icon: "🎯", title: "One goal", text: "Walk, water, or an early night." },
    ],
  },
  saturday: {
    preheader: "Weekend reflection: how did your body feel this week?",
    kicker: "Saturday reflection",
    hero: "How did your body feel this week?",
    body: "Weekend check-in time. Which day felt best? Any headaches, restless nights, or meals you'd change? A short reflection helps MedSafe spot patterns before they turn into problems.",
    cta: "Reflect on this week",
    prompts: [
      { icon: "📈", title: "Your patterns", text: "See what actually moved your labs." },
      { icon: "🎙️", title: "Voice log", text: "Just speak — we transcribe and file it." },
      { icon: "📄", title: "Pending reports", text: "Upload anything from this week." },
    ],
  },
};

function renderEmail(cadence: Cadence, name: string | null, token: string) {
  const first = (name || "there").split(" ")[0];
  const c = COPY[cadence];
  const body = c.body.replace("It's Monday.", `Hi ${first}, it's Monday.`).replace("Weekend check-in time.", `Hi ${first}, weekend check-in time.`);

  const prompts = c.prompts
    .map(
      (p) => `<td style="width:33.33%;vertical-align:top;padding:0 6px">
        <div style="background:${CREAM};border-radius:12px;padding:14px 12px;height:100%">
          <div style="font-size:20px;line-height:1">${p.icon}</div>
          <div style="font-weight:600;font-size:13px;margin-top:6px;color:${INK}">${p.title}</div>
          <div style="font-size:12px;line-height:1.45;color:${MUTED};margin-top:2px">${p.text}</div>
        </div>
      </td>`,
    )
    .join("");

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${c.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.06)">

        <tr><td style="padding:22px 28px;border-bottom:1px solid #f0e9e3">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;width:42px">
              <img src="${LOGO_URL}" width="42" height="42" alt="MedSafe" style="display:block;border:0;border-radius:12px" />
            </td>
            <td style="vertical-align:middle;padding-left:12px">
              <div style="font-size:19px;letter-spacing:-0.3px;color:${INK};font-weight:600">med<span style="color:${BRAND};font-weight:700">Safe</span></div>
              <div style="font-size:10px;color:${MUTED};letter-spacing:0.7px;text-transform:uppercase;margin-top:2px">One family · one health record</div>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:28px 28px 8px">
          <div style="display:inline-block;background:${CREAM};color:${BRAND};font-size:11px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;padding:5px 12px;border-radius:999px">${c.kicker}</div>
          <h1 style="margin:14px 0 12px;font-size:23px;line-height:1.25;color:${INK};font-weight:600">${c.hero}</h1>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#463d38">${body}</p>
          <a href="${APP_URL}/lifestyle" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:13px 24px;border-radius:999px;font-weight:600;font-size:15px">${c.cta} →</a>
        </td></tr>

        <tr><td style="padding:24px 22px 28px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${prompts}</tr></table>
        </td></tr>

        <tr><td style="padding:18px 28px;background:${CREAM};font-size:11px;color:${MUTED};text-align:center;line-height:1.6">
          You're getting this because you opted into MedSafe weekly check-ins.<br>
          <a href="${APP_URL}/unsubscribe?token=${token}" style="color:${MUTED}">Unsubscribe</a> ·
          <a href="${APP_URL}" style="color:${MUTED}">Open MedSafe</a>
        </td></tr>
      </table>
      <div style="max-width:560px;margin:14px auto 0;font-size:10px;color:#a89e97;text-align:center">MedSafe · DPDP-aligned · Your records stay yours.</div>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const cadence = (url.searchParams.get("cadence") === "saturday" ? "saturday" : "monday") as Cadence;
    const force = url.searchParams.get("force") === "1";
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
      if (!force && p.last_sent_at && String(p.last_sent_at).slice(0, 10) === today) continue;
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
