import { useEffect, useState } from "react";

type Phase = "morning" | "afternoon" | "evening" | "night";

function phaseForHour(h: number): Phase {
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "afternoon";
  if (h >= 17 && h < 20) return "evening";
  return "night";
}

export function LifestyleHeroBackground() {
  const [phase, setPhase] = useState<Phase>(() => phaseForHour(new Date().getHours()));

  useEffect(() => {
    const t = setInterval(() => setPhase(phaseForHour(new Date().getHours())), 60_000);
    return () => clearInterval(t);
  }, []);

  const isNight = phase === "night" || phase === "evening";

  return (
    <div
      aria-hidden
      data-phase={phase}
      className="lifestyle-hero pointer-events-none absolute inset-0 overflow-hidden"
    >
      <style>{`
        .lifestyle-hero { transition: background 1.2s ease; }
        /* Morning */
        .lifestyle-hero[data-phase="morning"] { --sky-1:#fde3d2; --sky-2:#f6c9c9; --sky-3:#e8dcd0; --ink:rgba(60,20,20,.55); }
        /* Afternoon: brighter, higher sun */
        .lifestyle-hero[data-phase="afternoon"] { --sky-1:#dff0ff; --sky-2:#eaf6ff; --sky-3:#f4ecdd; --ink:rgba(30,40,60,.55); }
        /* Evening: warm dusk */
        .lifestyle-hero[data-phase="evening"] { --sky-1:#ffb37a; --sky-2:#c77a6a; --sky-3:#3a2a3f; --ink:rgba(240,220,200,.75); }
        /* Night: dark blue with stars & street lamps */
        .lifestyle-hero[data-phase="night"] { --sky-1:#0b1836; --sky-2:#0a1226; --sky-3:#050914; --ink:rgba(220,230,255,.85); }

        .lifestyle-hero .sky {
          position:absolute; inset:0;
          background: linear-gradient(180deg, var(--sky-1) 0%, var(--sky-2) 55%, var(--sky-3) 100%);
          transition: background 1.2s ease;
        }

        /* Sun — morning + afternoon */
        .lifestyle-hero .sun {
          position:absolute; width:120px; height:120px; border-radius:50%;
          background: radial-gradient(circle, rgba(255,236,210,.95), rgba(255,180,150,.55) 55%, transparent 70%);
          filter: blur(2px);
          opacity: 0; transition: opacity 1.2s ease;
        }
        .lifestyle-hero[data-phase="morning"] .sun { left:12%; top:22%; opacity:1; }
        .lifestyle-hero[data-phase="afternoon"] .sun { left:60%; top:10%; opacity:1; background: radial-gradient(circle, rgba(255,250,220,.98), rgba(255,220,150,.55) 55%, transparent 70%); }
        .lifestyle-hero[data-phase="evening"] .sun { left:8%; top:55%; opacity:.9; background: radial-gradient(circle, rgba(255,180,110,.95), rgba(230,110,80,.5) 55%, transparent 72%); }

        /* Moon — night only */
        .lifestyle-hero .moon {
          position:absolute; left:78%; top:14%; width:78px; height:78px; border-radius:50%;
          background: radial-gradient(circle at 35% 35%, #f4f0dc, #cdd3e0 60%, #8e97ad 100%);
          box-shadow: 0 0 40px rgba(230,235,255,.35);
          opacity:0; transition: opacity 1.2s ease;
        }
        .lifestyle-hero[data-phase="night"] .moon { opacity:1; }

        /* Stars */
        .lifestyle-hero .stars { position:absolute; inset:0; opacity:0; transition: opacity 1.2s ease; }
        .lifestyle-hero[data-phase="night"] .stars,
        .lifestyle-hero[data-phase="evening"] .stars { opacity:1; }
        .lifestyle-hero .star {
          position:absolute; width:2px; height:2px; border-radius:50%;
          background:#fff; box-shadow:0 0 4px rgba(255,255,255,.9);
          animation: ls-twinkle 3s ease-in-out infinite;
        }

        @keyframes ls-twinkle {
          0%,100% { opacity:.3; transform:scale(1); }
          50% { opacity:1; transform:scale(1.4); }
        }

        /* Clouds — daytime only */
        .lifestyle-hero .cloud {
          position:absolute; top:12%; width:180px; height:44px; border-radius:999px;
          background: rgba(255,255,255,.55); filter: blur(1px);
          animation: ls-drift 60s linear infinite;
          opacity: 0; transition: opacity 1.2s ease;
        }
        .lifestyle-hero[data-phase="morning"] .cloud,
        .lifestyle-hero[data-phase="afternoon"] .cloud { opacity: 1; }
        .lifestyle-hero .cloud.c2 { top:24%; width:120px; height:32px; animation-duration:80s; animation-delay:-20s; }
        .lifestyle-hero .cloud.c3 { top:8%; width:220px; height:52px; animation-duration:100s; animation-delay:-45s; }
        .lifestyle-hero[data-phase="morning"] .cloud.c2,
        .lifestyle-hero[data-phase="afternoon"] .cloud.c2 { opacity:.7; }
        .lifestyle-hero[data-phase="morning"] .cloud.c3,
        .lifestyle-hero[data-phase="afternoon"] .cloud.c3 { opacity:.5; }

        @keyframes ls-drift {
          0% { transform: translateX(-20vw); }
          100% { transform: translateX(120vw); }
        }

        /* Ground + path */
        .lifestyle-hero .ground {
          position:absolute; left:0; right:0; bottom:0; height:38%;
          background: linear-gradient(180deg, transparent 0%, rgba(20,10,10,.12) 30%, rgba(10,5,10,.35) 100%);
        }
        .lifestyle-hero[data-phase="night"] .ground {
          background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.5) 30%, rgba(0,0,0,.85) 100%);
        }
        .lifestyle-hero .path {
          position:absolute; left:-5%; right:-5%; bottom:8%; height:2px; background: rgba(120,60,40,.25);
          transform: rotate(-1.2deg);
        }
        .lifestyle-hero[data-phase="night"] .path { background: rgba(200,215,255,.15); }

        /* Street lamps — evening/night */
        .lifestyle-hero .lamp {
          position:absolute; bottom:6%; width:6px; height:170px;
          background: linear-gradient(180deg, #2a3040 0%, #1a1e2a 100%);
          border-radius:2px;
          opacity: 0; transition: opacity 1.2s ease;
        }
        .lifestyle-hero[data-phase="evening"] .lamp,
        .lifestyle-hero[data-phase="night"] .lamp { opacity:1; }
        .lifestyle-hero .lamp::before {
          content:""; position:absolute; top:-6px; left:-12px; width:30px; height:10px;
          background:#1a1e2a; border-radius:4px;
        }
        .lifestyle-hero .lamp::after {
          content:""; position:absolute; top:2px; left:-9px; width:24px; height:16px; border-radius:6px;
          background: radial-gradient(ellipse at center, #ffe6a6 0%, #ffb84a 55%, #7a4a10 100%);
          box-shadow: 0 0 40px 16px rgba(255,196,90,.55), 0 0 120px 40px rgba(255,196,90,.28);
          animation: ls-flicker 4s ease-in-out infinite;
        }
        @keyframes ls-flicker {
          0%,100% { filter: brightness(1); }
          48% { filter: brightness(1.05); }
          50% { filter: brightness(.85); }
          52% { filter: brightness(1.02); }
        }
        .lifestyle-hero .lamp-1 { left: 18%; }
        .lifestyle-hero .lamp-2 { left: 62%; height:140px; }
        .lifestyle-hero .lamp-3 { left: 86%; height:180px; }

        /* Human figures */
        .lifestyle-hero .fig { position:absolute; bottom:12%; width:60px; height:110px; opacity:.85; }
        .lifestyle-hero .fig svg { width:100%; height:100%; overflow:visible; }
        .lifestyle-hero .fig .body { fill:none; stroke: var(--ink); stroke-width:2.5; stroke-linecap:round; stroke-linejoin:round; }
        .lifestyle-hero .fig .head { fill: var(--ink); }
        .lifestyle-hero .fig-yoga { left:14%; animation: ls-breathe 4s ease-in-out infinite; transform-origin:center bottom; }
        .lifestyle-hero .fig-walk { left:44%; animation: ls-walk 24s linear infinite; }
        .lifestyle-hero .fig-jog  { left:70%; animation: ls-jog 18s linear infinite; }
        @keyframes ls-breathe { 0%,100% { transform: scale(1);} 50% { transform: scale(1.04);} }
        @keyframes ls-walk {
          0% { transform: translateX(-40vw) translateY(0); }
          50% { transform: translateX(0vw) translateY(-2px); }
          100% { transform: translateX(40vw) translateY(0); }
        }
        @keyframes ls-jog {
          0% { transform: translateX(-45vw) translateY(0); }
          25% { transform: translateX(-20vw) translateY(-4px); }
          50% { transform: translateX(0) translateY(0); }
          75% { transform: translateX(22vw) translateY(-4px); }
          100% { transform: translateX(45vw) translateY(0); }
        }
        .lifestyle-hero .fig .leg-l, .lifestyle-hero .fig .arm-l { transform-origin: top; animation: ls-limb 0.9s ease-in-out infinite alternate; }
        .lifestyle-hero .fig .leg-r, .lifestyle-hero .fig .arm-r { transform-origin: top; animation: ls-limb 0.9s ease-in-out infinite alternate-reverse; }
        .lifestyle-hero .fig-jog .leg-l, .lifestyle-hero .fig-jog .arm-l,
        .lifestyle-hero .fig-jog .leg-r, .lifestyle-hero .fig-jog .arm-r { animation-duration: 0.5s; }
        .lifestyle-hero .fig-yoga .leg-l, .lifestyle-hero .fig-yoga .leg-r,
        .lifestyle-hero .fig-yoga .arm-l, .lifestyle-hero .fig-yoga .arm-r { animation: none; }
        @keyframes ls-limb { from { transform: rotate(-14deg);} to { transform: rotate(14deg);} }
        @media (prefers-reduced-motion: reduce) {
          .lifestyle-hero .cloud, .lifestyle-hero .fig, .lifestyle-hero .fig *,
          .lifestyle-hero .fig-yoga, .lifestyle-hero .star, .lifestyle-hero .lamp::after { animation: none !important; }
        }
      `}</style>

      <div className="sky" />
      <div className="sun" />
      <div className="moon" />

      <div className="stars">
        {STAR_POSITIONS.map((s, i) => (
          <span
            key={i}
            className="star"
            style={{ left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${s.d}s` }}
          />
        ))}
      </div>

      <div className="cloud" style={{ left: "10%" }} />
      <div className="cloud c2" style={{ left: "45%" }} />
      <div className="cloud c3" style={{ left: "60%" }} />

      <div className="ground" />
      <div className="path" />

      <div className="lamp lamp-1" />
      <div className="lamp lamp-2" />
      <div className="lamp lamp-3" />

      {/* Yoga (tree pose) */}
      <div className="fig fig-yoga">
        <svg viewBox="0 0 60 110">
          <circle className="head" cx="30" cy="14" r="7" />
          <path className="body" d="M30 22 L30 60" />
          <path className="body" d="M30 30 L14 46" />
          <path className="body" d="M30 30 L46 46" />
          <path className="body" d="M30 60 L30 96" />
          <path className="body" d="M30 60 L42 82 L38 96" />
        </svg>
      </div>

      {/* Walking */}
      <div className="fig fig-walk">
        <svg viewBox="0 0 60 110">
          <circle className="head" cx="30" cy="14" r="7" />
          <path className="body" d="M30 22 L30 58" />
          <path className="body arm-l" d="M30 30 L20 50" />
          <path className="body arm-r" d="M30 30 L40 48" />
          <path className="body leg-l" d="M30 58 L22 96" />
          <path className="body leg-r" d="M30 58 L38 96" />
        </svg>
      </div>

      {/* Jogging */}
      <div className="fig fig-jog">
        <svg viewBox="0 0 60 110">
          <circle className="head" cx="30" cy="12" r="7" />
          <path className="body" d="M30 20 L32 56" />
          <path className="body arm-l" d="M31 28 L18 44" />
          <path className="body arm-r" d="M31 28 L44 42" />
          <path className="body leg-l" d="M32 56 L20 92" />
          <path className="body leg-r" d="M32 56 L44 88" />
        </svg>
      </div>

      {/* keep isNight referenced so React removes an unused-var warning */}
      <span className="sr-only">{isNight ? "night" : "day"}</span>
    </div>
  );
}

const STAR_POSITIONS = [
  { x: 8, y: 10, d: 0 }, { x: 22, y: 18, d: 1.2 }, { x: 30, y: 6, d: 0.6 },
  { x: 44, y: 14, d: 2.1 }, { x: 55, y: 8, d: 1.8 }, { x: 68, y: 22, d: 0.4 },
  { x: 74, y: 6, d: 2.4 }, { x: 88, y: 18, d: 1.1 }, { x: 92, y: 28, d: 0.9 },
  { x: 14, y: 30, d: 1.5 }, { x: 38, y: 26, d: 2.6 }, { x: 50, y: 34, d: 0.2 },
  { x: 60, y: 30, d: 1.7 }, { x: 80, y: 34, d: 2.3 }, { x: 5, y: 22, d: 2.9 },
];
