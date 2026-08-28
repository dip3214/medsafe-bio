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

type Cadence = "monday" | "monday-afternoon" | "saturday" | "sunday" | "sunday-evening" | "intro" | "rakhi";

const COPY: Record<Cadence, {
  preheader: string;
  kicker: string;
  hero: string;
  body: string;
  cta: string;
  ctaHref: string;
  tip: string;
  prompts: { icon: string; title: string; text: string }[];
}> = {
  intro: {
    preheader: "One place for every family health record — reports, meds, daily logs.",
    kicker: "Meet MedSafe",
    hero: "Your family's health, finally in one place",
    body: "MedSafe keeps every prescription, lab report and daily habit for you, your parents and your kids in a single private timeline. Upload a report and we read it for you — values, flagged results and what they actually mean in plain language. Ask questions any time and log meals, sleep or how you feel in 30 seconds. Free to try, DPDP-aligned, and your records stay yours.",
    cta: "Try MedSafe free",
    ctaHref: "/auth",
    tip: "Start with one report — upload it and see your first health timeline in under a minute.",
    prompts: [
      { icon: "📄", title: "Upload reports", text: "We extract the values and flag what's off." },
      { icon: "💬", title: "Ask MedSafe", text: "Plain-language answers from your own records." },
      { icon: "👨‍👩‍👧", title: "Whole family", text: "You, parents and kids — one private account." },
    ],
  },
  monday: {
    preheader: "Three tiny logs beat one big one. Start the week right.",
    kicker: "Monday reset",
    hero: "A fresh week — small habits, big wins",
    body: "It's Monday. A 30-second check-in now sets the tone for the whole week. Log how you slept, what you ate for breakfast, and one thing you'll do for your body today.",
    cta: "Log today's check-in",
    ctaHref: "/lifestyle",
    tip: "Tip: set a lunch and bedtime reminder inside MedSafe — people who do log 3x more often.",
    prompts: [
      { icon: "🌙", title: "Sleep", text: "How many hours did you actually get?" },
      { icon: "🥗", title: "Breakfast", text: "Snap it — we estimate the calories." },
      { icon: "🎯", title: "One goal", text: "Walk, water, or an early night." },
    ],
  },
  "monday-afternoon": {
    preheader: "Mid-day check: lunch done? Log it in 20 seconds.",
    kicker: "Monday, mid-day",
    hero: "How's your Monday going so far?",
    body: "Half the day is done. Have you had your lunch yet? Whatever it was — dal-chawal, a rushed sandwich, or a skipped meal — it takes 20 seconds to log. And we'll nudge you again this evening so tonight's dinner and sleep get logged too.",
    cta: "Log my lunch",
    ctaHref: "/lifestyle",
    tip: "Tip: a photo counts as a full log — no typing needed.",
    prompts: [
      { icon: "🍛", title: "Lunch", text: "Snap it or type it — we estimate calories." },
      { icon: "💧", title: "Water & energy", text: "Feeling sluggish? Note it, patterns show up." },
      { icon: "🌆", title: "Evening nudge", text: "We'll remind you tonight to close the day." },
    ],
  },
  saturday: {
    preheader: "Weekend reflection: how did your body feel this week?",
    kicker: "Saturday reflection",
    hero: "How did your body feel this week?",
    body: "Weekend check-in time. Which day felt best? Any headaches, restless nights, or meals you'd change? A short reflection helps MedSafe spot patterns before they turn into problems.",
    cta: "Reflect on this week",
    ctaHref: "/lifestyle",
    tip: "Tip: even one line about how you slept is enough for MedSafe to spot a trend.",
    prompts: [
      { icon: "📈", title: "Your patterns", text: "See what actually moved your labs." },
      { icon: "🎙️", title: "Voice log", text: "Just speak — we transcribe and file it." },
      { icon: "📄", title: "Pending reports", text: "Upload anything from this week." },
    ],
  },
  "sunday-evening": {
    preheader: "Good evening — a calm two-minute close to your Sunday.",
    kicker: "Sunday evening",
    hero: "Good evening — how was your Sunday?",
    body: "Evenings are the easiest time to log. Tell us how the day went, and we'll turn it into patterns you can actually use.",
    cta: "Log my Sunday",
    ctaHref: "/lifestyle",
    tip: "The more you store, the sharper your patterns get — two lines tonight is enough.",
    prompts: [
      { icon: "🌇", title: "Close the day", text: "Dinner, mood, energy — 30 seconds." },
      { icon: "🔒", title: "Stored privately", text: "Your logs stay yours, DPDP-aligned." },
      { icon: "💬", title: "Talk to us", text: "Reply — a real person answers." },
    ],
  },
  sunday: {
    preheader: "Two minutes today makes the whole week easier.",
    kicker: "Sunday setup",
    hero: "Slow Sunday? Set your week up in 2 minutes",
    body: "Sundays are for resetting. Take two minutes to close out the weekend — how you slept, what you ate, how your body feels — and set your reminder times so nothing slips once Monday starts.",
    cta: "Set up my week",
    ctaHref: "/lifestyle",
    tip: "Tip: pick reminder times that match your real routine — lunch, evening walk, bedtime. You can add as many as you like.",
    prompts: [
      { icon: "⏰", title: "Reminders", text: "Choose your own nudge times — lunch, meds, bedtime." },
      { icon: "🛌", title: "Weekend sleep", text: "Log Saturday and Sunday nights while it's fresh." },
      { icon: "🗂️", title: "Family records", text: "Add a parent or kid report you've been putting off." },
    ],
  },
};

function renderEmail(cadence: Cadence, name: string | null, token: string) {
  const first = (name || "there").split(" ")[0];
  const c = COPY[cadence];
  const body = c.body.replace("It's Monday.", `Hi ${first}, it's Monday.`).replace("Weekend check-in time.", `Hi ${first}, weekend check-in time.`).replace("Half the day is done.", `Hi ${first}, half the day is done.`).replace("Sundays are for resetting.", `Hi ${first}, Sundays are for resetting.`).replace("MedSafe keeps", `Hi ${first} — MedSafe keeps`);

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
          <a href="${APP_URL}${c.ctaHref}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:13px 24px;border-radius:999px;font-weight:600;font-size:15px">${c.cta} →</a>
          <div style="margin-top:14px;font-size:13px;color:${MUTED}">Takes about 30 seconds · no typing required</div>
        </td></tr>

        <tr><td style="padding:24px 22px 4px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${prompts}</tr></table>
        </td></tr>

        <tr><td style="padding:18px 28px 4px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf3ee;border-left:3px solid ${BRAND};border-radius:10px">
            <tr><td style="padding:12px 14px;font-size:13px;line-height:1.5;color:#5b4c45">${c.tip}</td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:18px 28px 26px">
          <div style="font-size:11px;letter-spacing:0.8px;text-transform:uppercase;color:${MUTED};margin-bottom:8px">Jump straight in</div>
          <a href="${APP_URL}/lifestyle" style="display:inline-block;margin:0 8px 8px 0;font-size:13px;color:${BRAND};text-decoration:none;border:1px solid #efdfd7;border-radius:999px;padding:7px 14px">Log today</a>
          <a href="${APP_URL}/upload" style="display:inline-block;margin:0 8px 8px 0;font-size:13px;color:${BRAND};text-decoration:none;border:1px solid #efdfd7;border-radius:999px;padding:7px 14px">Add a report</a>
          <a href="${APP_URL}/chat" style="display:inline-block;margin:0 8px 8px 0;font-size:13px;color:${BRAND};text-decoration:none;border:1px solid #efdfd7;border-radius:999px;padding:7px 14px">Ask MedSafe</a>
          <a href="${APP_URL}/dashboard" style="display:inline-block;margin:0 8px 8px 0;font-size:13px;color:${BRAND};text-decoration:none;border:1px solid #efdfd7;border-radius:999px;padding:7px 14px">My timeline</a>
          <div style="margin-top:12px;font-size:13px;color:${MUTED};line-height:1.55">Just reply to this email if something feels off — a real person reads it.</div>
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

// A distinct, warmer "evening" template — dark header, conversational tone,
// focused on inviting a reply and explaining why storing logs helps.
function renderEveningEmail(name: string | null, token: string) {
  const first = (name || "there").split(" ")[0];
  const NIGHT = "#241b18";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4efea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">Good evening — two lines about your Sunday is all we need.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efea;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 2px 22px rgba(0,0,0,0.07)">

        <tr><td style="background:${NIGHT};padding:26px 28px">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td style="vertical-align:middle;width:44px">
              <img src="${LOGO_URL}" width="44" height="44" alt="MedSafe" style="display:block;border:0;border-radius:12px" />
            </td>
            <td style="vertical-align:middle;padding-left:12px">
              <div style="font-size:19px;letter-spacing:-0.3px;color:#fff;font-weight:600">med<span style="color:#ff9a7a;font-weight:700">Safe</span></div>
              <div style="font-size:10px;color:#c9b8b0;letter-spacing:0.7px;text-transform:uppercase;margin-top:2px">Sunday evening check-in</div>
            </td>
            <td align="right" style="vertical-align:middle;font-size:22px">🌙</td>
          </tr></table>
          <h1 style="margin:22px 0 8px;font-size:25px;line-height:1.25;color:#fff;font-weight:600">Good evening, ${first}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#e6d9d3">How was your Sunday? Before the week starts again, take two minutes with us.</p>
        </td></tr>

        <tr><td style="padding:26px 28px 6px">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#463d38">
            Evenings are the easiest time to log — the day is done and you remember it clearly. Tell MedSafe what you ate, how you slept last night, and how your body feels right now. It takes about 30 seconds, and you can speak it instead of typing.
          </p>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#463d38">
            Here's why it matters: every log you store becomes part of your own private health record. The more days we have, the better MedSafe gets at connecting the dots — why your energy dips, which meals affect your reports, what changed before a bad night's sleep. Your reports alone show numbers; your logs show the story behind them.
          </p>
          <a href="${APP_URL}/lifestyle" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:600;font-size:15px">Log my Sunday →</a>
          <div style="margin-top:12px;font-size:13px;color:${MUTED}">30 seconds · voice or photo, no typing needed</div>
        </td></tr>

        <tr><td style="padding:22px 28px 6px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0e4dd;border-radius:14px">
            <tr><td style="padding:16px 18px">
              <div style="font-size:11px;letter-spacing:0.8px;text-transform:uppercase;color:${MUTED};margin-bottom:10px">Tonight's three questions</div>
              <div style="font-size:14px;line-height:1.9;color:#463d38">
                🍽️ &nbsp;What did dinner look like today?<br>
                😴 &nbsp;How many hours did you sleep last night?<br>
                💭 &nbsp;How does your body feel — 1 to 10?
              </div>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:20px 28px 6px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf3ee;border-left:3px solid ${BRAND};border-radius:10px">
            <tr><td style="padding:14px 16px;font-size:14px;line-height:1.6;color:#5b4c45">
              <strong>We'd genuinely like to hear from you.</strong> Just hit reply and tell us what's working, what's confusing, or what you wish MedSafe did. A real person on our team reads every reply — and most of what we build comes from these emails.
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:20px 28px 26px">
          <div style="font-size:11px;letter-spacing:0.8px;text-transform:uppercase;color:${MUTED};margin-bottom:8px">Or pick up where you left off</div>
          <a href="${APP_URL}/lifestyle" style="display:inline-block;margin:0 8px 8px 0;font-size:13px;color:${BRAND};text-decoration:none;border:1px solid #efdfd7;border-radius:999px;padding:7px 14px">Log tonight</a>
          <a href="${APP_URL}/upload" style="display:inline-block;margin:0 8px 8px 0;font-size:13px;color:${BRAND};text-decoration:none;border:1px solid #efdfd7;border-radius:999px;padding:7px 14px">Add a report</a>
          <a href="${APP_URL}/chat" style="display:inline-block;margin:0 8px 8px 0;font-size:13px;color:${BRAND};text-decoration:none;border:1px solid #efdfd7;border-radius:999px;padding:7px 14px">Ask MedSafe</a>
          <a href="${APP_URL}/dashboard" style="display:inline-block;margin:0 8px 8px 0;font-size:13px;color:${BRAND};text-decoration:none;border:1px solid #efdfd7;border-radius:999px;padding:7px 14px">My timeline</a>
        </td></tr>

        <tr><td style="padding:18px 28px;background:${CREAM};font-size:11px;color:${MUTED};text-align:center;line-height:1.6">
          You're getting this because you signed up for MedSafe.<br>
          <a href="${APP_URL}/unsubscribe?token=${token}" style="color:${MUTED}">Unsubscribe</a> ·
          <a href="${APP_URL}" style="color:${MUTED}">Open MedSafe</a>
        </td></tr>
      </table>
      <div style="max-width:560px;margin:14px auto 0;font-size:10px;color:#a89e97;text-align:center">MedSafe · DPDP-aligned · Your records stay yours.</div>
    </td></tr>
  </table>
</body></html>`;
}

// Festive Raksha Bandhan template — maroon & gold, rakhi thread motif,
// ties sibling bond into family health (care for parents/siblings in MedSafe).
function renderRakhiEmail(name: string | null, token: string) {
  const first = (name || "there").split(" ")[0];
  const MAROON = "#7a1f1f";
  const GOLD = "#c9962e";
  const CREAM_BG = "#fdf7ef";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">Happy Raksha Bandhan — the thread that says "I care". Keep your family's health safe too. 🪔</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM_BG};padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 2px 22px rgba(0,0,0,0.08)">

        <tr><td style="background:${MAROON};padding:26px 28px;position:relative">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td style="vertical-align:middle;width:44px">
              <img src="${LOGO_URL}" width="44" height="44" alt="MedSafe" style="display:block;border:0;border-radius:12px" />
            </td>
            <td style="vertical-align:middle;padding-left:12px">
              <div style="font-size:19px;letter-spacing:-0.3px;color:#fff;font-weight:600">med<span style="color:#f4c76b;font-weight:700">Safe</span></div>
              <div style="font-size:10px;color:#e8cbb0;letter-spacing:0.7px;text-transform:uppercase;margin-top:2px">Raksha Bandhan wishes</div>
            </td>
            <td align="right" style="vertical-align:middle;font-size:24px">🪔</td>
          </tr></table>
          <div style="margin-top:22px;height:2px;background:linear-gradient(90deg,transparent,${GOLD},transparent);border-radius:2px"></div>
          <div style="text-align:center;margin:16px 0 4px;font-size:30px;line-height:1">🧵 🪢 🧵</div>
          <h1 style="margin:12px 0 8px;font-size:26px;line-height:1.3;color:#fff;font-weight:600;text-align:center">Happy Raksha Bandhan, ${first}</h1>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#f3e3d5;text-align:center">A thread on the wrist is a promise — <em>"I've got you."</em><br>That promise deserves a health record to match.</p>
        </td></tr>

        <tr><td style="padding:26px 28px 6px">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#463d38">
            Brothers and sisters spend today checking on each other — phone calls, sweets, old photos. But the most practical way to look after family is the one we rarely talk about: <strong>knowing their health.</strong>
          </p>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#463d38">
            MedSafe lets you keep your parents' and siblings' reports, medicines and check-ins in the same private timeline as yours — so the next "are you okay?" has real answers behind it, not just guesses.
          </p>
          <a href="${APP_URL}/dashboard" style="display:inline-block;background:${MAROON};color:#fff;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:600;font-size:15px">Add a family member →</a>
          <div style="margin-top:12px;font-size:13px;color:${MUTED}">Takes under a minute · fully private · DPDP-aligned</div>
        </td></tr>

        <tr><td style="padding:22px 28px 6px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eeddc9;border-radius:14px;background:#fffdf8">
            <tr><td style="padding:16px 18px">
              <div style="font-size:11px;letter-spacing:0.8px;text-transform:uppercase;color:${GOLD};margin-bottom:10px">This weekend, for the people you love</div>
              <div style="font-size:14px;line-height:1.9;color:#463d38">
                👨‍👩‍👧 &nbsp;Add your parents as members — their reports get read too.<br>
                📄 &nbsp;Upload one old report you found in a drawer.<br>
                ⏰ &nbsp;Set a medicine reminder for someone who always forgets.
              </div>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:20px 28px 6px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf3ee;border-left:3px solid ${MAROON};border-radius:10px">
            <tr><td style="padding:14px 16px;font-size:14px;line-height:1.6;color:#5b4c45">
              <strong>A small festive thank-you.</strong> Reply to this email and tell us one thing you'd want MedSafe to do for your family — every reply is read by a real person, and most features we build start exactly this way.
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:20px 28px 26px">
          <div style="font-size:11px;letter-spacing:0.8px;text-transform:uppercase;color:${MUTED};margin-bottom:8px">Jump straight in</div>
          <a href="${APP_URL}/dashboard" style="display:inline-block;margin:0 8px 8px 0;font-size:13px;color:${MAROON};text-decoration:none;border:1px solid #eeddc9;border-radius:999px;padding:7px 14px">Family timeline</a>
          <a href="${APP_URL}/upload" style="display:inline-block;margin:0 8px 8px 0;font-size:13px;color:${MAROON};text-decoration:none;border:1px solid #eeddc9;border-radius:999px;padding:7px 14px">Add a report</a>
          <a href="${APP_URL}/lifestyle" style="display:inline-block;margin:0 8px 8px 0;font-size:13px;color:${MAROON};text-decoration:none;border:1px solid #eeddc9;border-radius:999px;padding:7px 14px">Log today</a>
          <a href="${APP_URL}/chat" style="display:inline-block;margin:0 8px 8px 0;font-size:13px;color:${MAROON};text-decoration:none;border:1px solid #eeddc9;border-radius:999px;padding:7px 14px">Ask MedSafe</a>
        </td></tr>

        <tr><td style="padding:18px 28px;background:${CREAM_BG};font-size:11px;color:${MUTED};text-align:center;line-height:1.6">
          Warm Raksha Bandhan wishes from the MedSafe family to yours. 🧵<br>
          <a href="${APP_URL}/unsubscribe?token=${token}" style="color:${MUTED}">Unsubscribe</a> ·
          <a href="${APP_URL}" style="color:${MUTED}">Open MedSafe</a>
        </td></tr>
      </table>
      <div style="max-width:560px;margin:14px auto 0;font-size:10px;color:#a89e97;text-align:center">MedSafe · One family, one health record · DPDP-aligned</div>
    </td></tr>
  </table>
</body></html>`;
}

function renderFor(cadence: Cadence, name: string | null, token: string) {
  return cadence === "sunday-evening" ? renderEveningEmail(name, token)
    : cadence === "rakhi" ? renderRakhiEmail(name, token)
    : renderEmail(cadence, name, token);
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("cadence");
    const cadence = (q === "saturday" || q === "monday-afternoon" || q === "sunday" || q === "sunday-evening" || q === "intro" || q === "rakhi" ? q : "monday") as Cadence;
    const force = url.searchParams.get("force") === "1";
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ ok: false, error: "missing env" }), { status: 500 });
    }
    const subjectFor = (c: Cadence) =>
      c === "monday"
        ? "Let's make this a healthy week 💛"
        : c === "monday-afternoon"
        ? "How's your Monday going? Had lunch yet? 🍛"
        : c === "sunday-evening"
        ? "Good evening 🌙 How was your Sunday?"
        : c === "sunday"
        ? "Slow Sunday? Set your week up in 2 minutes 🌿"
        : c === "intro"
        ? "Your family's health records, all in one place — try MedSafe"
        : "How did your week feel? A quick MedSafe check-in";

    // Optional: send to an explicit list of external addresses (no DB lookup).
    let extRecipients: string[] = [];
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (Array.isArray(body?.recipients)) extRecipients = body.recipients.filter((x: unknown) => typeof x === "string");
      } catch { /* no body */ }
    }
    if (extRecipients.length > 0) {
      const extResults: { email: string; ok: boolean; err?: string }[] = [];
      for (const email of extRecipients) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: FROM,
              to: [email],
              subject: subjectFor(cadence),
              html: renderFor(cadence, null, ""),
              headers: { "List-Unsubscribe": `<${APP_URL}/unsubscribe>` },
            }),
          });
          if (!res.ok) {
            extResults.push({ email, ok: false, err: `${res.status} ${await res.text()}` });
            continue;
          }
          extResults.push({ email, ok: true });
        } catch (e) {
          extResults.push({ email, ok: false, err: String((e as Error).message ?? e) });
        }
      }
      return new Response(
        JSON.stringify({ ok: true, cadence, mode: "external", total: extRecipients.length, sent: extResults.filter((r) => r.ok).length, results: extResults }),
        { headers: { "Content-Type": "application/json" } },
      );
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
      const html = renderFor(cadence, name, p.unsubscribe_token);
      const subject = cadence === "monday"
        ? "Let's make this a healthy week 💛"
        : cadence === "monday-afternoon"
        ? "How's your Monday going? Had lunch yet? 🍛"
        : cadence === "sunday-evening"
        ? "Good evening 🌙 How was your Sunday?"
        : cadence === "sunday"
        ? "Slow Sunday? Set your week up in 2 minutes 🌿"
        : cadence === "intro"
        ? "Your family's health records, all in one place — try MedSafe"
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
