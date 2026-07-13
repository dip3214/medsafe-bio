// Contextual copy + phase mapping for the Lifestyle hero.
// One source of truth so the hero copy, background, and quick-tell placeholder
// all stay in sync with the time of day AND the day of week.

export type LifestylePhase =
  | "earlyMorning" // 5–9   • wake up, workout, gym
  | "lateMorning"  // 9–12  • work / study
  | "midday"       // 12–14 • lunch
  | "afternoon"    // 14–17 • how's your day going
  | "evening"      // 17–20 • evening workout
  | "dinner"       // 20–23 • dinner + wind down
  | "night";       // 23–5  • sleep

export type DayKind = "weekday" | "friday" | "saturday" | "sunday";

export type LifestyleContext = {
  phase: LifestylePhase;
  ambient: "day" | "dusk" | "night";
  dayKind: DayKind;
  dayLabel: string;   // "Sunday, 13 Jul"
  timeLabel: string;  // "6:42 PM"
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

function dayKindFor(d: Date): DayKind {
  const w = d.getDay(); // 0 Sun … 6 Sat
  if (w === 0) return "sunday";
  if (w === 6) return "saturday";
  if (w === 5) return "friday";
  return "weekday";
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDayLabel(d: Date) {
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function formatTimeLabel(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

type Copy = Pick<LifestyleContext, "badge" | "headline" | "sub" | "quickPromptPlaceholder" | "mealsPlaceholder"> & {
  ambient: LifestyleContext["ambient"];
};

function baseCopy(phase: LifestylePhase): Copy {
  switch (phase) {
    case "earlyMorning":
      return {
        ambient: "day",
        badge: "Sunrise · move",
        headline: (n) => `Good morning, ${n}.`,
        sub: "A gym set, a walk, a stretch — what got your body moving today?",
        quickPromptPlaceholder: "e.g. 20 min run and a light breakfast",
        mealsPlaceholder: "Breakfast: poha and tea · pre-workout: banana",
      };
    case "lateMorning":
      return {
        ambient: "day",
        badge: "Deep-work hours",
        headline: (n) => `Focus mode, ${n}.`,
        sub: "Between meetings and tabs — any water, a mindful sip, a stretch?",
        quickPromptPlaceholder: "e.g. two coffees, skipped breakfast, feeling flat",
        mealsPlaceholder: "Mid-morning: coffee, fruit, a biscuit…",
      };
    case "midday":
      return {
        ambient: "day",
        badge: "Lunch time",
        headline: (n) => `Lunch break, ${n}.`,
        sub: "What's on your plate today? A quick note now saves a story later.",
        quickPromptPlaceholder: "e.g. dal, rice, sabzi and a small salad",
        mealsPlaceholder: "Lunch: dal, rice, sabzi · curd · salad",
      };
    case "afternoon":
      return {
        ambient: "day",
        badge: "Afternoon check-in",
        headline: (n) => `How's the day going, ${n}?`,
        sub: "Halfway home. A snack, a walk, a win — anything worth logging?",
        quickPromptPlaceholder: "e.g. felt sluggish after lunch, walked 10 min",
        mealsPlaceholder: "Snack: chai and roasted chana…",
      };
    case "evening":
      return {
        ambient: "dusk",
        badge: "Movement o'clock",
        headline: (n) => `Good evening, ${n}.`,
        sub: "The golden hour for a workout — walk, run, yoga, or a gym set?",
        quickPromptPlaceholder: "e.g. 30 min gym — chest and light cardio",
        mealsPlaceholder: "Evening tea, pre-workout snack…",
      };
    case "dinner":
      return {
        ambient: "night",
        badge: "Dinner & wind-down",
        headline: (n) => `Dinner time, ${n}.`,
        sub: "How was dinner, and how did the day treat you overall?",
        quickPromptPlaceholder: "e.g. roti, sabzi, dal — a calm day",
        mealsPlaceholder: "Dinner: roti and sabzi · warm milk…",
      };
    case "night":
      return {
        ambient: "night",
        badge: "Winding down",
        headline: (n) => `Good night, ${n}.`,
        sub: "One last note before sleep — anything you'd like tomorrow to know?",
        quickPromptPlaceholder: "e.g. felt tired, in bed by 11, hoping for 7 hours",
        mealsPlaceholder: "Late snack, a glass of water…",
      };
  }
}

// Day-of-week overlays — many folks get Sat + Sun off, so weekends lean
// restful and social; Friday nods to wind-down; weekdays keep the base copy.
function applyDayOverlay(copy: Copy, phase: LifestylePhase, day: DayKind): Copy {
  if (day === "sunday") {
    switch (phase) {
      case "earlyMorning":
        return { ...copy, badge: "Slow Sunday", headline: (n) => `Happy Sunday, ${n}.`, sub: "No alarm rush today — a lazy walk, a long breakfast, or five more minutes in bed?" };
      case "lateMorning":
        return { ...copy, badge: "Sunday brunch", headline: (n) => `Take it easy, ${n}.`, sub: "Brunch, a book, a bit of sunshine — what's on the plan for a slow Sunday?" };
      case "midday":
        return { ...copy, badge: "Sunday lunch", headline: (n) => `Family plate, ${n}?`, sub: "The big Sunday meal — anything special cooking today?" };
      case "afternoon":
        return { ...copy, badge: "Sunday afternoon", headline: (n) => `A calm afternoon, ${n}.`, sub: "A nap, a stroll, or prepping for the week — how's your Sunday shaping up?" };
      case "evening":
        return { ...copy, badge: "Sunday reset", headline: (n) => `Good evening, ${n}.`, sub: "The week's on the doorstep — a gentle walk and an early night could set it right." };
      case "dinner":
        return { ...copy, badge: "Sunday dinner", headline: (n) => `Wind it down, ${n}.`, sub: "Light dinner, early to bed — Monday will thank you." };
      case "night":
        return { ...copy, badge: "Sunday night", headline: (n) => `Rest well, ${n}.`, sub: "One quiet note, then sleep. A fresh week starts tomorrow." };
    }
  }
  if (day === "saturday") {
    switch (phase) {
      case "earlyMorning":
        return { ...copy, badge: "Saturday morning", headline: (n) => `Happy Saturday, ${n}.`, sub: "Weekend workout, a long walk, or a lazy start — what feels right today?" };
      case "lateMorning":
        return { ...copy, badge: "Weekend mode", headline: (n) => `Enjoy it, ${n}.`, sub: "Errands, brunch, a bit of you-time — how are you spending Saturday?" };
      case "midday":
        return { ...copy, badge: "Saturday lunch", headline: (n) => `Lunch out, ${n}?`, sub: "Home-cooked or something new — what's for lunch today?" };
      case "afternoon":
        return { ...copy, badge: "Saturday afternoon", headline: (n) => `How's the day, ${n}?`, sub: "The best kind of afternoon — friends, family, or a quiet corner?" };
      case "evening":
        return { ...copy, badge: "Saturday night", headline: (n) => `Good evening, ${n}.`, sub: "Plans out or a night in? Either way — hydrate and enjoy." };
      case "dinner":
        return { ...copy, badge: "Saturday dinner", headline: (n) => `Dinner time, ${n}.`, sub: "How was Saturday? Anything worth remembering from today?" };
      case "night":
        return { ...copy, badge: "Late Saturday", headline: (n) => `Take it easy, ${n}.`, sub: "One more day off tomorrow — sleep in guilt-free." };
    }
  }
  if (day === "friday") {
    switch (phase) {
      case "afternoon":
        return { ...copy, badge: "Friday afternoon", headline: (n) => `Almost there, ${n}.`, sub: "The weekend is around the corner — how did the week treat you?" };
      case "evening":
        return { ...copy, badge: "Friday evening", headline: (n) => `It's Friday, ${n}.`, sub: "A workout, a walk, or dinner with people you like — pick your kind of Friday." };
      case "dinner":
        return { ...copy, badge: "Friday dinner", headline: (n) => `Weekend mode, ${n}.`, sub: "Two days ahead of you. How was dinner, how was the week?" };
      default:
        return copy;
    }
  }
  return copy;
}

export function getLifestyleContext(now: Date = new Date()): LifestyleContext {
  const phase = phaseForHour(now.getHours());
  const dayKind = dayKindFor(now);
  const overlaid = applyDayOverlay(baseCopy(phase), phase, dayKind);
  return {
    phase,
    ambient: overlaid.ambient,
    dayKind,
    dayLabel: formatDayLabel(now),
    timeLabel: formatTimeLabel(now),
    badge: overlaid.badge,
    headline: overlaid.headline,
    sub: overlaid.sub,
    quickPromptPlaceholder: overlaid.quickPromptPlaceholder,
    mealsPlaceholder: overlaid.mealsPlaceholder,
  };
}
