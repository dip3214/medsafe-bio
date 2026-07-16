# MedSafe Refresh Plan

A single coordinated pass across theme, landing page, app pages, lifestyle, upload, and security. Grouped so nothing regresses between tabs.

## 1. Color system — lighten the red, unify across pages

- Rework `src/styles.css` design tokens: shift `--primary` from heavy crimson to a warmer, softer terracotta/rosewood (Luffu-style muted warmth). Backgrounds become warm off‑white cream (`oklch(0.985 0.01 60)`); text becomes deep cocoa (`oklch(0.22 0.03 30)`); accent becomes muted sage or dusty gold for contrast.
- Reduce primary saturation ~40%. All red gradients replaced with soft warm gradients.
- Every page (`auth`, `upload`, `dashboard`, `doctors`, `care`, `lifestyle`, `members`, `chat`, `account`) uses only semantic tokens — audit and replace any lingering `bg-red-*`, `text-white`, hex literals.
- Header, footer, buttons, chips, member switcher all pulled through the same tokens so the palette is uniform.

## 2. Landing page (`src/routes/index.tsx`)

- Restyle to Luffu-like calmness: cream background, large serif display headline, generous whitespace, subtle framer-motion reveals, hover scale 1.02.
- **Character messaging** (auto-cycling persona lines) moves to the **right side** of the hero, stacked vertically; on mobile it stacks below the headline with the same right-aligned card treatment. Full-width safe.
- **Value proposition section (image #1 reference)**: show BOTH the dashboard mockup AND the chatbot mockup side-by-side with the "Positioning Value: Track, Ask, & Understand Your Life-style" headline. Currently only chatbot half renders — fix by placing two mockup images (dashboard + chat) in a responsive 2-col grid that stacks on mobile.
- **Lifestyle section image**: replace current `ref-lifestyle.png` visual with the newly uploaded Life-style mockup (image #1 from this message) — upload as new asset and swap.
- **Trust row**: keep only `DPDP-aligned` and `Physician-led only`. Remove the "brochure" / extra card sitting under the regulatory compliance row (image #2 reference — the floating brochure card in the middle goes; keep just the chip row).
- Post-login CTA leads to a new **segment picker** landing (see §6).

## 3. Post-login segment landing

- New route `src/routes/_authenticated/index.tsx` (or reuse `/dashboard` entry) showing three big cards: **MedSafe Me**, **MedSafe Parents**, **MedSafe Kids**. Each card switches active member segment and routes to `/dashboard`.
- Same three cards also surfaced as a compact strip on `/dashboard` top for quick switching.

## 4. Dashboard — flagged values per member

- On `/dashboard`, add a "Attention needed" panel: pulls latest `lab_results` rows where `flag` in (`high`,`low`,`critical`) for the active member (or all members with a per-member badge). Server function: `listFlaggedLabs` in `src/lib/medsafe.functions.ts`.

## 5. Lifestyle section

- **Loosen chatbot guardrails**: update system prompt in the lifestyle chat/AI path so it answers scientifically (cite mechanisms, give evidence-based reasoning) instead of refusing/redirecting. Keep a small safety footer only for red-flag symptoms.
- **Location**: `src/lib/use-weather.ts` — request `navigator.geolocation.getCurrentPosition` with `{ enableHighAccuracy: true, timeout: 8000 }`, fall back to IP only if user denies; add explicit permission prompt UI in the lifestyle hero pill; cache last known coords in `localStorage` so refresh doesn't lose it.
- Hero image/asset for lifestyle updated to match new palette.

## 6. Upload page — extraction animation

- Replace current extraction spinner with a smooth staged animation: shimmer over the document preview, progress steps ("Reading → Structuring → Verifying → Saving") using framer-motion, and a subtle pulsing badge. Remove the glitchy state transitions by driving purely from a single `status` state machine.

## 7. Consistency polish (all pages)

- Shared page header component (title + subtitle + optional action) used on `auth`, `upload`, `dashboard`, `doctors`, `care`, `lifestyle`.
- Same serif display font for page titles as landing hero; same sans for body.
- Motion primitives: `Reveal` component reused across pages for on-scroll fades.

## 8. Security fix

- Finding `SUPA_authenticated_security_definer_function_executable` (SECURITY DEFINER function callable by signed-in users). Audit `has_role` and `owns_member`: both are legitimate helpers used by RLS. Fix: `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` on both and `GRANT EXECUTE ... TO service_role` (RLS internals still work because SECURITY DEFINER runs as owner regardless of caller execute grants — confirm by keeping `postgres` grant). Then mark finding as fixed.

---

## Technical notes

- Files touched: `src/styles.css`, `src/routes/index.tsx`, `src/routes/auth.tsx`, `src/routes/_authenticated/dashboard.tsx`, `src/routes/_authenticated/upload.tsx`, `src/routes/_authenticated/lifestyle.tsx`, `src/routes/_authenticated/route.tsx` (segment landing), `src/components/SiteLayout.tsx`, `src/components/LifestyleHeroBackground.tsx`, `src/lib/use-weather.ts`, `src/lib/lifestyle.functions.ts` (chatbot prompt), `src/lib/medsafe.functions.ts` (flagged labs), new asset for lifestyle image.
- One new migration for GRANT/REVOKE on security definer functions.
- No schema changes to tables.

## Out of scope (confirm if wanted)

- Rewriting the chat page UI beyond palette.
- Adding a new brochure PDF (removing per your request).

Approve and I'll implement in one pass.
