import { useEffect, useState } from "react";

/** One-time playful teddy bear intro that walks up and gives a thumbs-up next to the logo. */
export function TeddyIntro() {
  const [phase, setPhase] = useState<"hidden" | "walk" | "thumbs" | "rest" | "done">("hidden");

  useEffect(() => {
    try {
      if (sessionStorage.getItem("medsafe.teddyShown") === "1") {
        setPhase("done");
        return;
      }
      sessionStorage.setItem("medsafe.teddyShown", "1");
    } catch {}
    const t1 = setTimeout(() => setPhase("walk"), 200);
    const t2 = setTimeout(() => setPhase("thumbs"), 1500);
    const t3 = setTimeout(() => setPhase("rest"), 2400);
    const t4 = setTimeout(() => setPhase("done"), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  if (phase === "done") return null;

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute -left-7 top-1/2 -translate-y-1/2 select-none text-2xl teddy teddy-${phase}`}
    >
      <span className="teddy-bear">🧸</span>
      {(phase === "thumbs" || phase === "rest") && (
        <span className="teddy-thumb">👍</span>
      )}
    </span>
  );
}
