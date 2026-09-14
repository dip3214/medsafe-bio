# MedSafe product experience redesign

## Goal
Bring MedSafe closer to the supplied references while preserving every existing feature and workflow.

## What will change
- Restyle the landing page with the first reference’s pale blue/green ambient background, crisp dark typography, compact navigation, floating health motifs, and layered product preview composition.
- Remove About, mission, founders, and contact content from the landing page; create a dedicated About page and link it in desktop, mobile, and footer navigation.
- Reframe the two feature messages “Answers grounded in your reports” and “20 seconds a day with zero friction” as visual product demonstrations rather than long text blocks.
- Rebuild the Dashboard into a modern health-overview layout inspired by the second reference: denser summary panels, high-contrast trends, flagged-value emphasis, and a polished report library.
- Give every report a clear “View original” action when its source file is available, while retaining extracted summaries, prescriptions, trends, timeline grouping, exports, and Kids vaccination tools.
- Redesign Lifestyle around a cinematic Indian daily-life scene with time/weather-aware motion, clear text contrast, modern check-in panels, meal-photo upload, voice logging, goals, reminders, and existing analytics unchanged.
- Redesign Upcoming as an interactive roadmap with animated status/progress and clearer feature categories, without implying unreleased features are available.

## Technical details
- Use only the supplied screenshots as visual references; they will not be embedded in the app.
- Keep TanStack routing, Supabase calls, RLS behavior, report data, weather logic, and all current mutations unchanged.
- Add semantic design tokens for the requested cool white, powder blue, pale green, charcoal, and lime accents.
- Keep all layouts usable on mobile and respect reduced-motion preferences.
- Add unique page metadata for the new About page and refresh metadata on changed content pages.
- Validate type safety and inspect the result at desktop and mobile sizes.
