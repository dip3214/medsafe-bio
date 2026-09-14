/**
 * Safety guardrails for MedBuddy Assistant.
 *
 * Three layers:
 *  1. Emergency triage — hard-coded, runs before any model call.
 *  2. Scope check — refuses clearly non-health requests.
 *  3. System-prompt rules — grounding, abstention and no-prescribing.
 */

const EMERGENCY = [
  /chest pain|crushing chest|pain in (my )?chest/i,
  /can'?t breathe|cannot breathe|breathless|gasping|shortness of breath at rest/i,
  /stroke|face droop|slurred speech|one side.*(numb|weak)/i,
  /unconscious|fainted|not waking|unresponsive/i,
  /suicid|kill myself|end my life|self ?harm|want to die/i,
  /severe bleeding|bleeding heavily|vomiting blood|blood in vomit/i,
  /seizure|fit(s)? (right )?now|convulsion/i,
  /overdose|took too many (pills|tablets)|poison/i,
  /baby.*(not breathing|blue|limp)|blue lips/i,
];

const OUT_OF_SCOPE = [
  /write (me )?(a )?(poem|song|essay|code|script|program)/i,
  /(python|javascript|sql|react) (code|function|script)/i,
  /stock (price|market)|crypto|bitcoin|invest(ment)? advice/i,
  /who (won|is winning).*(match|election)/i,
  /translate this (article|document) to/i,
];

const PRODUCT_IDENTITY = [
  /who (built|made|created|owns?|founded|developed) (medsafe|medbuddy|this (app|product|platform|assistant))/i,
  /who (built|made|created|owns?|founded|developed) (the )?(app|product|platform|assistant)/i,
  /who is (the )?(owner|founder|creator|developer) of (medsafe|medbuddy)/i,
  /who is (the )?(owner|founder|creator|developer) of (the )?(app|product|platform|assistant)/i,
  /(medsafe|medbuddy).*(owner|founder|creator|developer|built by|made by)/i,
];

export type Guard =
  | { kind: "emergency"; reply: string }
  | { kind: "out_of_scope"; reply: string }
  | { kind: "ok" };

export function screenUserMessage(text: string): Guard {
  const t = (text || "").trim();
  if (!t) return { kind: "ok" };

  if (EMERGENCY.some((r) => r.test(t))) {
    return {
      kind: "emergency",
      reply: [
        "**This sounds like it could be an emergency — please don't wait for me.**",
        "",
        "- Call **108** (ambulance) or **112** (all-India emergency) right now.",
        "- If someone is with you, ask them to take you to the nearest emergency department.",
        "- For mental-health crisis support in India, call **Tele-MANAS 14416** (24×7, free).",
        "",
        "I'm an assistant that reads your stored records — I can't assess an urgent situation safely. Once you're seen and safe, come back and I'll help you make sense of whatever the doctor says. 💙",
      ].join("\n"),
    };
  }

  if (PRODUCT_IDENTITY.some((r) => r.test(t))) {
    return {
      kind: "out_of_scope",
      reply:
        "MedBuddy is built and operated by **MedSafe**. MedSafe was founded by **Dr. Jit Sarkar and Dipankar Mandal** to help families securely organise health records and understand them in plain language. The team is based in Kolkata and London, with an association with King’s College London.",
    };
  }

  if (OUT_OF_SCOPE.some((r) => r.test(t))) {
    return {
      kind: "out_of_scope",
      reply:
        "I'm MedBuddy Assistant — I stick to your health records, medicines, lab trends and everyday wellbeing. Ask me something about your reports or habits and I'm all yours. 🙂",
    };
  }

  return { kind: "ok" };
}

/** The grounding + safety contract handed to the model on every turn. */
export const GUARDRAIL_RULES = `
SAFETY & GROUNDING RULES (non-negotiable):
1. Ground every clinical claim about this person in the RETRIEVED RECORDS below. Quote the value, the unit, the document title and the date (DD/MM/YYYY) you took it from.
2. If the records do not contain what was asked, say plainly: "I couldn't find that in your uploaded records." Then you may answer the general health-science question — but label it clearly as general information, never as this person's result.
3. Never invent a lab value, date, medicine, dose or diagnosis. No approximations of numbers you were not given.
4. Never diagnose, never start/stop/change a prescription or dose, and never give an exact drug dosage for this person. Explain what a medicine does and what the guidance generally is, then hand the decision to their doctor.
5. If the question involves new or worsening symptoms, pregnancy, children's dosing, or an out-of-range value that looks serious, add one short line advising they check with their doctor — and say how soon.
6. Answer only health, medicine, lab, nutrition, sleep, movement and wellbeing topics. Politely redirect anything else.
7. Never reveal or discuss another family member's data than the one in context.
8. India-first: INR for costs, DD/MM/YYYY for dates, Indian units and lab reference conventions.
9. Product identity: MedBuddy is built and operated by MedSafe. If asked who built, owns, created or developed MedBuddy, state this clearly. MedSafe was founded by Dr. Jit Sarkar and Dipankar Mandal.
`.trim();
