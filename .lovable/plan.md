## What I'll build

### 1. Pinned quick actions
- New `QuickActions` component with 4 buttons: **Add document · Ask MedSafe · Log check-in · Log it**.
- Rendered as a compact pill bar at the top of Dashboard, Upload, Lifestyle (right under the page header) — same order everywhere so muscle memory works.
- Dashboard also gets a floating action bar (sticky bottom on mobile, bottom-right cluster on desktop) that collapses into the existing Ask MedSafe FAB on other pages.
- Segment-aware: "Log check-in / Log it" only shown for the **Me** segment.

### 2. Weather refresh control
- Add a small refresh icon next to the day/time/temp pill on Lifestyle. Tapping it:
  - re-requests `navigator.geolocation` (fresh fix, not cached),
  - clears the cached `medsafe.weather.v1` entry,
  - shows a spinner + "Updated just now" toast on success.
- Expose `refresh()` from `useWeather()` so it's a one-line hook change.

### 3. MedSafe logo on Summary report
- Add a print-safe header to `/summary`: heart-pulse logo mark + "MedSafe" wordmark + tagline "One family. One health record.", followed by patient info.
- Uses inline SVG (no external asset) so it prints reliably.

### 4. iOS "opens report → session breaks" fix
Root cause: `window.open(signedUrl, "_blank")` on iOS Safari sometimes navigates the current tab (popup blocker) to the Supabase storage URL, which on return path resets the Supabase auth listener. Also `<a target="_blank" href={signedUrl}>` on the print page inherits `rel="opener"` and can steal focus.

Fix in both flows:
- **Uploaded doc viewer** (dashboard/upload → open original): open in a **new tab safely** — use a hidden `<a>` element with `rel="noopener noreferrer"` and a user-gesture click; fall back to same-tab navigation only if the popup is blocked. Also add a "Download" option that fetches the blob and triggers a `URL.createObjectURL` download — bypasses Safari's cross-origin quirks entirely.
- **Summary print page**: replace `window.print()` inside a click handler with a small delay + explicit `document.title` restoration; the current implementation triggers Safari's print dialog before layout stabilizes, which is what leaves the app in a bad state.
- Verify signed-URL creation uses a **short-lived (5 min)** URL (already is) and set `download` param on `createSignedUrl` for the download path so Safari doesn't try to render inline.

### 5. Share to WhatsApp on Summary
- Add a **Share** button next to Print. On tap:
  - Uses `navigator.share()` when available (iOS/Android native sheet with WhatsApp),
  - Falls back to a direct `https://wa.me/?text=…` link with a pre-composed summary (patient name, date range, top 3 diagnoses, top 3 flagged labs, link back to app).
- Also generates a **public share link** to a read-only summary token (see #4 in Technical section).

### 6. Weekly wellness emails (Mon + Sat mornings)
- Enable **Resend** connector; store `RESEND_API_KEY` via the connector.
- New table `email_preferences` (opt-in default true, unsubscribe token).
- Server route `POST /api/public/hooks/weekly-nudge` — pulls users with opt-in, composes a warm HTML email with two rotating tones:
  - **Monday**: "Let's make this week count — 3 tiny logs beat 1 big one." + top-of-week nudge (log breakfast, mood, sleep). CTA → `/lifestyle`.
  - **Saturday**: "How did your week feel?" — summary of what they logged (or a gentle "your week is a blank page" if empty). CTA → weekend check-in.
- `pg_cron`: Monday 08:00 IST + Saturday 09:00 IST, calls the hook via `pg_net` with `apikey` header.
- Emails link to a one-tap unsubscribe URL that flips the preference.

### 7. Redesigned Dashboard + Timeline
Full redesign (as chosen):
- **Hero band**: Member + segment picker (Me/Parents/Kids) + a large "Flagged now" card showing latest out-of-range lab values as pill chips with trend arrows (▲/▼ vs previous visit). Click a chip → jumps to the source document.
- **Quick actions row** (pinned, per #1).
- **Timeline column** (left, 60% on desktop): visit-grouped cards, each with date, doctor/hospital chip, diagnoses badges, lab count, medicines count. Collapsed by default, expand on click. Filter chips at top: All / Reports / Prescriptions / Last 30 days.
- **Right rail** (40%): 
  - **This week in numbers** — check-ins, meals logged, workouts, avg mood (Me segment only).
  - **Medications** — active meds with next-dose hints (Parents/Kids too).
  - **Vaccinations** — IAP schedule card for Kids segment (retained + polished).
- Consistent card style: rounded-2xl, soft shadow, warm ivory bg, terracotta accents — matches landing page typography.
- Empty states illustrated (not just "No data yet").
- Mobile: sections stack; quick actions become a sticky bottom bar.

## Technical details

- **Files to add**: `src/components/QuickActions.tsx`, `src/components/FlaggedNowCard.tsx`, `src/components/TimelineList.tsx`, `src/components/WeekSnapshot.tsx`, `src/routes/api/public/hooks/weekly-nudge.ts`, `src/lib/email-prefs.functions.ts`, `src/lib/share.ts`, `src/routes/api/public/summary.$token.ts` (public read-only share page — no PII beyond names user opts in to include).
- **Files to edit**: `src/routes/_authenticated/dashboard.tsx` (full rewrite of layout), `src/routes/_authenticated/summary.tsx` (logo header, Share button, print-safe iOS fix), `src/routes/_authenticated/lifestyle.tsx` (weather refresh button), `src/routes/_authenticated/upload.tsx` + doc-open helpers (iOS-safe open/download), `src/lib/use-weather.ts` (expose `refresh()`), `src/lib/medsafe.functions.ts` (add `getDocumentDownloadUrl` with `download=true`).
- **Migrations**:
  - `email_preferences` table (user_id, weekly_enabled, unsubscribe_token, timezone).
  - `summary_shares` table for share tokens (user_id, member_id, token, expires_at) — read via a public route with token check.
  - Enable `pg_cron` + `pg_net`; schedule 2 cron entries hitting the weekly-nudge hook.
- **Resend**: `standard_connectors--connect` with `resend`; sender from a verified domain the user provides (I'll fall back to `onboarding@resend.dev` for the owner's own address during testing).
- **Security**: weekly-nudge hook requires `apikey` header matching anon key; per-user email loops use `supabaseAdmin` inside the handler only after the request is verified. Share route returns only the fields the owner opted into; token expires in 7 days.

## What I won't touch
- Existing chat, auth, and family-member logic.
- Lifestyle background animations (only adding the weather refresh button).

Approve and I'll ship it end-to-end. For the Resend piece I'll pause once to walk you through adding the API key + verifying your sender domain.