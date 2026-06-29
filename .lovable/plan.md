
This is a large change set. I'll ship it in one coherent pass.

## 1. Family members (segment selector)

**DB migration** (single migration):
- `family_members` table: `id` (uuid PK), `user_id` (FK auth.users), `name`, `segment` (enum `kids|parents|me`), `relation`, `dob`, `avatar_color`, timestamps. RLS: owner-only. GRANTs to authenticated/service_role.
- Add nullable `member_id uuid` column + FK + index to: `documents`, `extractions`, `lab_results`, `medications`, `action_items`, `summaries`, `episodes`, `chat_threads`.
- Trigger on `auth.users` insert (extend `handle_new_user`) to seed a default "Me" member so every account has one segment id under the user's unique id.

**App**:
- `ActiveMemberContext` (localStorage-persisted active member id) + `MemberSwitcher` dropdown in `SiteLayout` header (avatar chip with segment color).
- `/members` route to add/edit/delete family members, grouped by segment (Kids / Parents / Me).
- Upload + chat + dashboard scope by `member_id`. New records auto-stamp the active member.

## 2. Summary report export

- New `/_authenticated/summary` route. Button on dashboard: **"Export summary report"**.
- Server function `generateSummaryReport({ memberId })` pulls the **last 2 visits** (or 1 if only one exists) from grouped docs/labs/meds and asks Gemini to produce a structured clinical summary (diagnoses, med changes, lab deltas, action items).
- Render as a clean printable HTML page with a "Download PDF" button using `window.print()` (no Node-only PDF libs — Worker-safe). Persist generated summaries to `summaries` table.

## 3. Chat changes

- **Remove sidebar**: `/chat` becomes a single ephemeral chat per visit. Drop the threads index/sidebar UI. Keep `chat_messages` writes scoped to one rolling thread per (user, member) so context persists silently, but no UI list.
- **Clickable suggestions**: starter prompts auto-fill input and submit on click via `sendMessage({ text })`.
- **Empty-state → active fade**: AnimatePresence-style CSS transition.
- **Polish**: focus ring animation on textarea/send, message `animate-fade-in` (already in tokens), typing dots component (three bouncing dots), smooth-scroll to bottom via `scrollIntoView({ behavior: 'smooth' })`, `overscroll-contain` + `-webkit-overflow-scrolling: touch` on container, suggestion cards `hover:scale-[1.02] active:scale-[0.98] transition`.

## 4. Landing page dynamic events card

- Replace hardcoded "Aarav's latest events" with `<LatestEventsCard />` client component.
- When signed in: fetch top 3 most recent **flagged** (`high|low|critical`) lab results for active member via authed server fn.
- Empty state: "Upload a report to see your flagged values here" + CTA → `/upload`.
- Signed out: keep a clearly-labeled "Sample" preview (badge "Sample data") so the landing page still demonstrates the product.

## 5. DPDP (India) compliance

- **Pages**: `/privacy` and `/dpdp-notice` routes covering purpose limitation, data principal rights, retention, grievance officer placeholder, contact.
- **Consent banner**: first-visit bottom banner with Accept / Customize. Granular toggles (storage of medical records, AI processing, anonymized analytics). Stored in existing `consents` table keyed by user (or anonymous localStorage pre-auth).
- **Settings page** `/_authenticated/account`:
  - Manage consents (toggle + withdraw).
  - **Export my data** → server fn returns JSON of all user-owned rows; client downloads as `medsafe-export-<date>.json`.
  - **Delete my account** → confirmation dialog → server fn (`requireSupabaseAuth`) loads `supabaseAdmin` inside handler, deletes user rows + storage objects + auth user (right to erasure).

## 6. Layout fixes ("sections should not intersect")

- Audit landing + chat: add explicit `py-*` spacing, `clear` floats, ensure floating "Ask MedSafe" button uses safe-area inset and doesn't overlap segment cards. Constrain hero grid heights so the events card never overlaps segment row on small screens.

## Technical notes

- Migration runs first (separate tool call), then code lands after approval & types regen.
- All new server fns use `requireSupabaseAuth`. Admin client (`client.server`) loaded inside handler in account-delete fn only.
- DPDP consent state is non-sensitive flags → safe in `consents` table per existing schema; we'll add columns only if missing.
- No new heavy deps. `framer-motion` not needed — Tailwind keyframes (`animate-fade-in`, `animate-scale-in`) and CSS transitions cover the chat polish. `react-markdown` already installed.
- Member id naming: human/clinical concept = family member; each member's UUID is the "unique id under one optimum unique id (the user)".

## Out of scope

- Multi-user sharing of a member record (e.g. spouse co-access). Can follow.
- Actual PDF generation server-side. We use browser print-to-PDF, which is reliable and Worker-safe.

Approve and I'll run the migration, then implement.
