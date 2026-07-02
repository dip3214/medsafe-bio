# MedSafe: Family Isolation + Lifestyle + Segment Routing + Polish

Four independent additive changes. Existing Records/Kids/Parents flows are not modified except where explicitly noted (RLS audit, homepage buttons, polish).

## 1. Family isolation & original-file access

**Audit + fix data scoping**
- Verify RLS on `family_members`, `documents`, `extractions`, `lab_results`, `medications`, `action_items`, `episodes`, `summaries`, `chat_threads`, `chat_messages` — every policy must scope to `auth.uid() = user_id` AND (where applicable) match `member_id` to a member owned by the caller. Add a `SECURITY DEFINER` helper `public.owns_member(_member uuid)` and reference it from policies so a switched context can never leak.
- Server functions (`listDocuments`, `listExtractions`, dashboard/timeline reads, chat context) all take `member_id` from the client and filter on it server-side; never trust cached client state across a switch.
- Client: on `setActiveId`, immediately invalidate all `["docs"]`, `["labs"]`, `["dashboard"]`, `["chat", ...]` queries (React Query `invalidateQueries`) and gate rendering on `activeMember.id === queryMemberId` to avoid transient cross-render flash.

**Add member flow (rebuild)**
- The `/members` add-profile modal already exists; verify wiring, add DOB field, and confirm the switcher works. Also expose an "Add member" affordance on the switcher when the segment has zero members.

**Original document access (source-of-truth)**
- Add `getDocumentSignedUrl` server function returning a 5-min signed URL from the private `medical-documents` bucket, scoped by `user_id + member_id` check.
- Every extracted-event card (upload, timeline, summary, dashboard) gets a "View original" button opening the signed URL in a new tab.

## 2. Lifestyle tab (Me segment only)

**Route**: `src/routes/_authenticated/lifestyle.tsx`. Nav item conditionally rendered when `active.segment === "me"`.

**Hero (isolated component `LifestyleHeroBackground`)**
- Layered SVG dawn gradient sky + slow-drifting CSS-animated clouds (transform-only keyframes).
- Three human figures animated with pure CSS/SVG (yoga stretch, walking, jogging) — Lottie in this project has failed twice before; using CSS/SVG keyframes for reliability. Low-opacity, brand red/cream palette.
- Foreground: headline "Your day, your rhythm." + subtext.
- Scoped `<style>` block — animation cannot leak.

**Daily log form**
- Sleep hours (number), exercise type (select) + minutes, meals (textarea).
- Auto-save (debounced) → `lifestyle_logs` upsert on `(user_id, log_date)`.

**Auto-calculation panel**
- Compute weekly avg sleep/exercise, streak, and trend (this week vs last) from server-side aggregation function.

**Goals**
- `lifestyle_goals` table: sleep_hours_target, exercise_min_per_day, exercise_days_per_week.
- Progress ring + dynamic appreciation message generated from actual counts.

**Chatbot integration**
- Extend `/api/chat` with a Lifestyle system-prompt injection when `context=lifestyle`, and a new tool/function-call path: parse natural language into a lifestyle log via Gemini, upsert on server.
- Simpler alternative used here: a dedicated server fn `parseLifestyleUpdate` invoked when chat is opened from Lifestyle tab; on parse success it upserts and confirms in chat.

## 3. Homepage segment routing

Rewrite Explore handlers on Kids / Parents / Me cards:
- Me → setActiveId to default profile → navigate `/dashboard`.
- Kids/Parents → if members[segment] exists: setActiveId(first) → navigate `/dashboard`. Else navigate to a new route `/onboard/$segment` that shows a short contextual intro + add-member form; on submit → setActiveId(newId) → `/dashboard`.

## 4. Visual polish (restrained)

- `styles.css`: warm the reds by ~4-6% saturation, add a cream surface token variant.
- Add `Reveal` (already exists) to Home segment cards + Lifestyle sections only. NOT applied to timeline/dashboard/records lists.
- Hover: subtle `-translate-y-0.5` + shadow ring on segment cards; 150ms fade on MemberSwitcher active change.
- No background motion outside Lifestyle.

## Database migrations

```sql
-- Ownership helper for member scoping
CREATE OR REPLACE FUNCTION public.owns_member(_member uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM family_members WHERE id=_member AND user_id=auth.uid())
$$;
REVOKE EXECUTE ON FUNCTION public.owns_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_member(uuid) TO authenticated;

-- Tighten member_id policies on all scoped tables (documents, extractions,
-- lab_results, medications, action_items, episodes, summaries):
--   USING (user_id = auth.uid() AND (member_id IS NULL OR public.owns_member(member_id)))

-- Lifestyle
CREATE TABLE public.lifestyle_logs (
  id uuid PK, user_id uuid NOT NULL, log_date date NOT NULL,
  sleep_hours numeric, exercise_type text, exercise_minutes int,
  meals text, created_at, updated_at,
  UNIQUE(user_id, log_date)
);
CREATE TABLE public.lifestyle_goals (
  id uuid PK, user_id uuid UNIQUE NOT NULL,
  sleep_hours_target numeric, exercise_min_per_day int,
  exercise_days_per_week int, created_at, updated_at
);
-- Grants + RLS scoped to auth.uid() = user_id.
```

## Files touched (new / edited)

- migrations (2): RLS tighten + lifestyle tables
- `src/lib/lifestyle.functions.ts` (new)
- `src/lib/medsafe.functions.ts` (add `getDocumentSignedUrl`, invalidate helpers)
- `src/routes/_authenticated/lifestyle.tsx` (new)
- `src/components/LifestyleHeroBackground.tsx` (new, scoped CSS)
- `src/routes/onboard.$segment.tsx` (new)
- `src/routes/index.tsx` (rewire Explore buttons + subtle hover/reveal)
- `src/components/SiteLayout.tsx` (add Lifestyle nav for Me segment)
- `src/routes/_authenticated/upload.tsx`, `dashboard.tsx`, `summary.tsx` (add "View original" buttons; invalidate on member switch)
- `src/lib/active-member.tsx` (invalidate queries on switch)
- `src/routes/api/chat.ts` + `src/routes/_authenticated/chat.tsx` (Lifestyle parse path)
- `src/styles.css` (warm palette tweak, no structural change)

## Out of scope this pass
- Kids/Parents lifestyle variants
- Any change to timeline/records rendering beyond the "View original" button
- Rebranding
