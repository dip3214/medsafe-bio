// Contextual copy + phase mapping for the Lifestyle hero.
// One source of truth so the hero copy, background, and quick-tell placeholder
// all stay in sync with the time of day.

export type LifestylePhase =
  | "earlyMorning" // 5–9   • wake up, workout, gym
  | "lateMorning"  // 9–12  • work / study
  | "midday"       // 12–14 • lunch
  | "afternoon"    // 14–17 • how's your day going
  | "evening"      // 17–20 • evening workout
  | "dinner"       // 20–23 • dinner + wind down
  | "night";       // 23–5  • sleep

export type LifestyleContext = {
  phase: LifestylePhase;
  ambient: "day" | "dusk" | "night";
  badge: string;
  headline: (name: string) => string;
  sub: string;
  quickPromptPlaceholder: string;
  mealsPlaceholder: string;
};

export function phaseForHour(h: number): LifestylePhase {
  if (h >= 5 && h < 9) return "earlyMorning";
  if (h >= 9 && h < 12) return "lateMorning";
  if (h >= 12 && h < 14) return "midday";
  if (h >= 14 && h < 17) return "afternoon";
  if (h >= 17 && h < 20) return "evening";
  if (h >= 20 && h < 23) return "dinner";
  return "night";
}

export function getLifestyleContext(now: Date = new Date()): LifestyleContext {
  const phase = phaseForHour(now.getHours());
  switch (phase) {
    case "earlyMorning":
      return {
        phase,
        ambient: "day",
        badge: "Sunrise · move",
        headline: (n) => `Good morning, ${n}.`,
        sub: "A gym set, a walk, a stretch — what got your body moving today?",
        quickPromptPlaceholder: "e.g. 20 min run and a light breakfast",
        mealsPlaceholder: "Breakfast: poha and tea · pre-workout: banana",
      };
    case "lateMorning":
      return {
        phase,
        ambient: "day",
        badge: "Deep-work hours",
        headline: (n) => `Focus mode, ${n}.`,
        sub: "Between meetings and tabs — any water, a mindful sip, a stretch?",
        quickPromptPlaceholder: "e.g. two coffees, skipped breakfast, feeling flat",
        mealsPlaceholder: "Mid-morning: coffee, fruit, a biscuit…",
      };
    case "midday":
      return {
        phase,
        ambient: "day",
        badge: "Lunch time",
        headline: (n) => `Lunch break, ${n}.`,
        sub: "What's on your plate today? A quick note now saves a story later.",
        quickPromptPlaceholder: "e.g. dal, rice, sabzi and a small salad",
        mealsPlaceholder: "Lunch: dal, rice, sabzi · curd · salad",
      };
    case "afternoon":
      return {
        phase,
        ambient: "day",
        badge: "Afternoon check-in",
        headline: (n) => `How's the day going, ${n}?`,
        sub: "Halfway home. A snack, a walk, a win — anything worth logging?",
        quickPromptPlaceholder: "e.g. felt sluggish after lunch, walked 10 min",
        mealsPlaceholder: "Snack: chai and roasted chana…",
      };
    case "evening":
      return {
        phase,
        ambient: "dusk",
        badge: "Movement o'clock",
        headline: (n) => `Good evening, ${n}.`,
        sub: "The golden hour for a workout — walk, run, yoga, or a gym set?",
        quickPromptPlaceholder: "e.g. 30 min gym — chest and light cardio",
        mealsPlaceholder: "Evening tea, pre-workout snack…",
      };
    case "dinner":
      return {
        phase,
        ambient: "night",
        badge: "Dinner & wind-down",
        headline: (n) => `Dinner time, ${n}.`,
        sub: "How was dinner, and how did the day treat you overall?",
        quickPromptPlaceholder: "e.g. roti, sabzi, dal — a calm day",
        mealsPlaceholder: "Dinner: roti and sabzi · warm milk…",
      };
    case "night":
      return {
        phase,
        ambient: "night",
        badge: "Winding down",
        headline: (n) => `Good night, ${n}.`,
        sub: "One last note before sleep — anything you'd like tomorrow to know?",
        quickPromptPlaceholder: "e.g. felt tired, in bed by 11, hoping for 7 hours",
        mealsPlaceholder: "Late snack, a glass of water…",
      };
  }
}
