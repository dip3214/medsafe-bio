
## 1. Lamp-pull login (`/auth`)

- Rebuild `src/routes/auth.tsx` as a dark, cinematic scene:
  - Full-bleed near-black background, faint hint text "Pull the string to turn on the light".
  - A CSS/SVG lamp on the left with a hanging cord + brass toggle. The login card on the right is invisible (opacity 0, blurred) until the light is on.
  - Interaction: user drags the cord downward (pointer/touch) OR taps it. On release past a threshold, the bulb "clicks" on — warm cone of light fans out, the card fades/scales in, and the tagline reveals.
  - Uses Framer Motion (already in stack via animations) for the cord drag, bulb glow, and card entrance. Persist "lamp on" for the session so returning to `/auth` in the same tab keeps it lit.
  - Reduced-motion + keyboard fallback: a visually-hidden "Turn on the light" button toggles the same state.
- Copy under the product name (per user):
  - Title: **MedSafe**
  - Tagline: **"Shining light on your scattered health data."**
  - Sub: "One private home for every prescription, lab report, and daily check-in."
- Keep the existing form intact: email/password sign-in + sign-up + "Continue with Google". Only the shell/animation changes.

## 2. UX refresh — public + app tabs (Lifestyle untouched)

Shared moves across all listed pages:
- New visual language: warm ivory background `#F7F4EE`, deep clinical navy `#0B1F3A`, warm amber accent `#E5A24B` (echoes the lamp), soft card surfaces with hairline borders + generous whitespace.
- Type pairing: **Fraunces** (display, editorial serif) + **Inter Tight** (body). Loaded via `@fontsource` in `src/main.tsx`.
- Reusable primitives added to `src/components/`:
  - `PageHero` (eyebrow + serif headline + supporting line + optional lamp-glow accent)
  - `SectionCard` (rounded 2xl, hairline border, subtle inner highlight)
  - `StatPill`, `SoftDivider`
- Consistent header treatment in `SiteLayout` (tighter nav, active-tab underline in amber).

Per-page changes:
- **Landing `/`** — new hero with a small lamp motif tying back to auth, restructured "Why MedSafe" grid (3+3 cards), a "How it works" 3-step strip, testimonial band, footer CTA. Copy stays product-accurate; only layout/visuals change.
- **`/doctors`, `/services`, `/care` (public "Upcoming"), `/privacy`, `/dpdp-notice`** — rebuilt around `PageHero` + `SectionCard`; same content, cleaner rhythm, better mobile stacking.
- **`/upload`** — hero + two-column layout (uploader card on left, live "Your reports" list on right on desktop; stacked on mobile). Clearer empty state, per-report chips (date · type · flagged values).
- **`/dashboard`, `/summary`, `/members`, `/account`** — refreshed cards, new StatPill row on dashboard, calmer typography.
- **`/chat`** — new header strip, softer bubble styling using the new tokens, sticky composer with amber send button. Behavior unchanged.
- **`/_authenticated/lifestyle` is NOT touched** (except for the popup wiring in §3).

## 3. Daily "How was your day?" popup on Lifestyle

- New `src/components/DailyMoodPrompt.tsx` — Radix Dialog, opens on first visit to `/_authenticated/lifestyle` per calendar day.
- Content: greeting ("Good evening, {name} — how was your day?") + 5 emoji faces (😣 😕 😐 🙂 😄) mapped to `mood: 1–5`. Buttons: **Save** and **Skip**.
- Persistence:
  - Add `mood` (smallint, 1–5) column to the existing `lifestyle_logs` table via migration, plus grants + RLS (owner-only, member-scoped) consistent with existing policies.
  - Extend `saveLifestyleLog` (or add `saveMoodOnly`) in `src/lib/lifestyle.functions.ts` to upsert today's mood for the active member.
  - Frontend gate: `localStorage` key `medsafe:mood-prompt:{memberId}:{YYYY-MM-DD}` — set on Save or Skip so it only appears once per day per member.
- After save: toast "Mood logged" and, if the user picked ≤2, gently suggest opening the "Or just tell me" section — no forced flow.

## Technical notes

- Route files unchanged in count; only contents replaced. No `src/routeTree.gen.ts` edits.
- Fonts: `bun add @fontsource/fraunces @fontsource/inter-tight`, imported in `src/main.tsx`; Tailwind theme tokens added in `src/styles.css` (`--font-display`, `--font-sans`, new color tokens). No hardcoded hex in components — all through tokens.
- Lamp animation is pure Framer Motion + SVG; no new deps beyond what's already in the project.
- Migration: single new file under `supabase/migrations/` adding `mood` column with `GRANT`s and updated policies as needed; no destructive changes.
- Verification: after build, drive Playwright to `/auth` (lamp pull → card appears), `/` (new hero renders), `/_authenticated/lifestyle` on a fresh day (popup opens, saves, doesn't re-open on reload).
