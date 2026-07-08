import { useEffect, useState } from "react";
import { phaseForHour, type LifestylePhase } from "@/lib/lifestyle-context";

export function LifestyleHeroBackground({ phase: phaseProp }: { phase?: LifestylePhase } = {}) {
  const [autoPhase, setAutoPhase] = useState<LifestylePhase>(() => phaseForHour(new Date().getHours()));

  useEffect(() => {
    if (phaseProp) return;
    const t = setInterval(() => setAutoPhase(phaseForHour(new Date().getHours())), 60_000);
    return () => clearInterval(t);
  }, [phaseProp]);

  const phase = phaseProp ?? autoPhase;
  const isDusk = phase === "evening";
  const isNight = phase === "dinner" || phase === "night";
  const showSun = phase === "earlyMorning" || phase === "lateMorning" || phase === "midday" || phase === "afternoon";

  return (
    <div
      aria-hidden
      data-phase={phase}
      className="lifestyle-hero pointer-events-none absolute inset-0 overflow-hidden"
    >
      <style>{`
        .lifestyle-hero { transition: background 1.2s ease; }

        /* Palettes */
        .lifestyle-hero[data-phase="earlyMorning"] { --sky-1:#ffd7b4; --sky-2:#ffb197; --sky-3:#f0d9c2; --ink:rgba(60,25,20,.6); --ground:rgba(30,15,10,.18); }
        .lifestyle-hero[data-phase="lateMorning"]  { --sky-1:#e6f4ff; --sky-2:#f6faff; --sky-3:#f0ebe0; --ink:rgba(30,40,55,.55); --ground:rgba(30,40,60,.14); }
        .lifestyle-hero[data-phase="midday"]       { --sky-1:#cfe8ff; --sky-2:#e9f4ff; --sky-3:#f6efdd; --ink:rgba(25,40,60,.5); --ground:rgba(20,35,55,.12); }
        .lifestyle-hero[data-phase="afternoon"]    { --sky-1:#ffe3c1; --sky-2:#ffcf9e; --sky-3:#efdcc0; --ink:rgba(80,40,20,.55); --ground:rgba(70,35,20,.16); }
        .lifestyle-hero[data-phase="evening"]      { --sky-1:#ff9c6a; --sky-2:#b56078; --sky-3:#2f2547; --ink:rgba(255,225,200,.85); --ground:rgba(20,10,25,.55); }
        .lifestyle-hero[data-phase="dinner"]       { --sky-1:#1a1f3f; --sky-2:#151732; --sky-3:#0a0d1e; --ink:rgba(230,220,255,.9); --ground:rgba(0,0,0,.65); }
        .lifestyle-hero[data-phase="night"]        { --sky-1:#0a1128; --sky-2:#070c1c; --sky-3:#03060f; --ink:rgba(220,230,255,.9); --ground:rgba(0,0,0,.8); }

        .lifestyle-hero .sky {
          position:absolute; inset:0;
          background: linear-gradient(180deg, var(--sky-1) 0%, var(--sky-2) 55%, var(--sky-3) 100%);
          transition: background 1.2s ease;
        }

        /* Sun — positioned by phase */
        .lifestyle-hero .sun {
          position:absolute; width:130px; height:130px; border-radius:50%;
          background: radial-gradient(circle, rgba(255,240,215,.98), rgba(255,190,140,.6) 55%, transparent 72%);
          filter: blur(2px); opacity: 0;
          transition: opacity 1.2s ease, left 1.5s ease, top 1.5s ease, background 1.2s ease;
        }
        .lifestyle-hero[data-phase="earlyMorning"] .sun { left:10%; top:38%; opacity:1;
          background: radial-gradient(circle, rgba(255,220,170,.98), rgba(255,150,110,.6) 55%, transparent 72%); }
        .lifestyle-hero[data-phase="lateMorning"] .sun { left:35%; top:16%; opacity:1; }
        .lifestyle-hero[data-phase="midday"] .sun { left:52%; top:8%; opacity:1;
          background: radial-gradient(circle, rgba(255,252,230,1), rgba(255,225,150,.6) 55%, transparent 72%); }
        .lifestyle-hero[data-phase="afternoon"] .sun { left:70%; top:22%; opacity:.95;
          background: radial-gradient(circle, rgba(255,205,150,.98), rgba(230,120,80,.55) 55%, transparent 72%); }
        .lifestyle-hero[data-phase="evening"] .sun { left:10%; top:62%; opacity:.9;
          background: radial-gradient(circle, rgba(255,170,100,.95), rgba(220,90,70,.55) 55%, transparent 72%); }

        /* Sun rays for midday */
        .lifestyle-hero .rays {
          position:absolute; left:47%; top:2%; width:180px; height:180px;
          opacity: 0; transition: opacity 1.2s ease;
          background: conic-gradient(from 0deg, rgba(255,240,180,0) 0deg, rgba(255,240,180,.35) 6deg, rgba(255,240,180,0) 12deg,
            rgba(255,240,180,0) 40deg, rgba(255,240,180,.28) 46deg, rgba(255,240,180,0) 52deg,
            rgba(255,240,180,0) 80deg, rgba(255,240,180,.28) 86deg, rgba(255,240,180,0) 92deg,
            rgba(255,240,180,0) 120deg, rgba(255,240,180,.28) 126deg, rgba(255,240,180,0) 132deg,
            rgba(255,240,180,0) 160deg, rgba(255,240,180,.28) 166deg, rgba(255,240,180,0) 172deg,
            rgba(255,240,180,0) 200deg, rgba(255,240,180,.28) 206deg, rgba(255,240,180,0) 212deg,
            rgba(255,240,180,0) 240deg, rgba(255,240,180,.28) 246deg, rgba(255,240,180,0) 252deg,
            rgba(255,240,180,0) 280deg, rgba(255,240,180,.28) 286deg, rgba(255,240,180,0) 292deg,
            rgba(255,240,180,0) 320deg, rgba(255,240,180,.28) 326deg, rgba(255,240,180,0) 332deg,
            rgba(255,240,180,0) 360deg);
          border-radius:50%;
          animation: ls-spin 60s linear infinite;
        }
        .lifestyle-hero[data-phase="midday"] .rays { opacity:.7; }
        @keyframes ls-spin { to { transform: rotate(360deg); } }

        /* Moon */
        .lifestyle-hero .moon {
          position:absolute; left:78%; top:14%; width:78px; height:78px; border-radius:50%;
          background: radial-gradient(circle at 35% 35%, #f6f2df, #cfd5e1 60%, #909aae 100%);
          box-shadow: 0 0 40px rgba(230,235,255,.35);
          opacity:0; transition: opacity 1.2s ease;
        }
        .lifestyle-hero[data-phase="dinner"] .moon,
        .lifestyle-hero[data-phase="night"] .moon { opacity:1; }

        /* Stars */
        .lifestyle-hero .stars { position:absolute; inset:0; opacity:0; transition: opacity 1.2s ease; }
        .lifestyle-hero[data-phase="evening"] .stars { opacity:.5; }
        .lifestyle-hero[data-phase="dinner"] .stars,
        .lifestyle-hero[data-phase="night"] .stars { opacity:1; }
        .lifestyle-hero .star {
          position:absolute; width:2px; height:2px; border-radius:50%;
          background:#fff; box-shadow:0 0 4px rgba(255,255,255,.9);
          animation: ls-twinkle 3s ease-in-out infinite;
        }
        @keyframes ls-twinkle {
          0%,100% { opacity:.3; transform:scale(1); }
          50% { opacity:1; transform:scale(1.5); }
        }
        /* Shooting star — deep night only */
        .lifestyle-hero .shoot {
          position:absolute; top:18%; left:-10%; width:120px; height:2px;
          background: linear-gradient(90deg, transparent, #fff, transparent);
          opacity:0; transform: rotate(-18deg);
        }
        .lifestyle-hero[data-phase="night"] .shoot { animation: ls-shoot 9s linear infinite; }
        @keyframes ls-shoot {
          0%   { transform: translate(0,0) rotate(-18deg); opacity:0; }
          8%   { opacity:1; }
          20%  { transform: translate(70vw, 22vh) rotate(-18deg); opacity:0; }
          100% { opacity:0; }
        }

        /* Clouds — day only */
        .lifestyle-hero .cloud {
          position:absolute; top:12%; width:180px; height:44px; border-radius:999px;
          background: rgba(255,255,255,.65); filter: blur(1px);
          animation: ls-drift 60s linear infinite;
          opacity: 0; transition: opacity 1.2s ease;
        }
        .lifestyle-hero[data-phase="earlyMorning"] .cloud,
        .lifestyle-hero[data-phase="lateMorning"] .cloud,
        .lifestyle-hero[data-phase="midday"] .cloud,
        .lifestyle-hero[data-phase="afternoon"] .cloud { opacity: 1; }
        .lifestyle-hero .cloud.c2 { top:24%; width:120px; height:32px; animation-duration:80s; animation-delay:-20s; opacity:0; }
        .lifestyle-hero .cloud.c3 { top:8%;  width:220px; height:52px; animation-duration:100s; animation-delay:-45s; opacity:0; }
        .lifestyle-hero[data-phase="earlyMorning"] .cloud.c2,
        .lifestyle-hero[data-phase="lateMorning"] .cloud.c2,
        .lifestyle-hero[data-phase="midday"] .cloud.c2,
        .lifestyle-hero[data-phase="afternoon"] .cloud.c2 { opacity:.75; }
        .lifestyle-hero[data-phase="earlyMorning"] .cloud.c3,
        .lifestyle-hero[data-phase="lateMorning"] .cloud.c3,
        .lifestyle-hero[data-phase="midday"] .cloud.c3,
        .lifestyle-hero[data-phase="afternoon"] .cloud.c3 { opacity:.55; }
        @keyframes ls-drift {
          0% { transform: translateX(-25vw); }
          100% { transform: translateX(125vw); }
        }

        /* Birds — early morning */
        .lifestyle-hero .bird {
          position:absolute; font-size: 18px; color: rgba(50,25,20,.55);
          opacity:0; animation: ls-bird 22s linear infinite;
        }
        .lifestyle-hero[data-phase="earlyMorning"] .bird { opacity:1; }
        .lifestyle-hero .bird.b2 { animation-delay:-8s; animation-duration:28s; font-size:14px; }
        .lifestyle-hero .bird.b3 { animation-delay:-15s; animation-duration:26s; font-size:12px; }
        @keyframes ls-bird {
          0%   { transform: translate(-10vw, 30vh) scaleX(1); }
          50%  { transform: translate(55vw, 12vh) scaleX(1); }
          100% { transform: translate(115vw, 24vh) scaleX(1); }
        }

        /* Falling leaves — afternoon */
        .lifestyle-hero .leaf {
          position:absolute; top:-4%; width:10px; height:14px; border-radius: 60% 20% 60% 20%;
          background: rgba(180,80,40,.6);
          opacity:0; animation: ls-leaf 14s linear infinite;
        }
        .lifestyle-hero[data-phase="afternoon"] .leaf { opacity:1; }
        .lifestyle-hero .leaf.l2 { animation-delay:-4s; background: rgba(200,120,50,.55); }
        .lifestyle-hero .leaf.l3 { animation-delay:-8s; background: rgba(160,70,40,.55); }
        .lifestyle-hero .leaf.l4 { animation-delay:-11s; background: rgba(220,150,70,.55); }
        @keyframes ls-leaf {
          0%   { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(6vw, 80vh) rotate(360deg); }
        }

        /* Steam curls — midday & dinner (food/tea) */
        .lifestyle-hero .steam {
          position:absolute; bottom:22%; width:6px; height:40px; border-radius:6px;
          background: linear-gradient(180deg, rgba(255,255,255,.7), rgba(255,255,255,0));
          filter: blur(4px); opacity:0;
          animation: ls-steam 4s ease-in-out infinite;
        }
        .lifestyle-hero[data-phase="midday"] .steam,
        .lifestyle-hero[data-phase="dinner"] .steam { opacity:.9; }
        .lifestyle-hero .steam.s2 { animation-delay:-1.4s; }
        .lifestyle-hero .steam.s3 { animation-delay:-2.6s; }
        @keyframes ls-steam {
          0%   { transform: translateY(0) scale(1); opacity:0; }
          30%  { opacity:.9; }
          100% { transform: translateY(-70px) scale(1.4); opacity:0; }
        }

        /* Window lights (offices) — late morning */
        .lifestyle-hero .windows {
          position:absolute; right:6%; bottom:14%; width:120px; height:180px;
          background:
            linear-gradient(rgba(255,255,255,.75), rgba(255,255,255,.75)) 0 0 /18px 12px no-repeat,
            linear-gradient(rgba(255,255,255,.55), rgba(255,255,255,.55)) 30px 0 /18px 12px no-repeat,
            linear-gradient(rgba(255,255,255,.7),  rgba(255,255,255,.7))  60px 0 /18px 12px no-repeat,
            linear-gradient(rgba(255,255,255,.5),  rgba(255,255,255,.5))  90px 0 /18px 12px no-repeat,
            linear-gradient(rgba(255,255,255,.65), rgba(255,255,255,.65)) 0 24px /18px 12px no-repeat,
            linear-gradient(rgba(255,255,255,.55), rgba(255,255,255,.55)) 30px 24px /18px 12px no-repeat,
            linear-gradient(rgba(255,255,255,.7),  rgba(255,255,255,.7))  60px 24px /18px 12px no-repeat,
            linear-gradient(rgba(255,255,255,.5),  rgba(255,255,255,.5))  90px 24px /18px 12px no-repeat,
            linear-gradient(180deg, rgba(60,70,90,.5), rgba(30,40,60,.7));
          border-radius: 4px 4px 0 0;
          opacity: 0; transition: opacity 1.2s ease;
        }
        .lifestyle-hero[data-phase="lateMorning"] .windows { opacity:.55; }

        /* Ground + path */
        .lifestyle-hero .ground {
          position:absolute; left:0; right:0; bottom:0; height:38%;
          background: linear-gradient(180deg, transparent 0%, var(--ground) 40%, var(--ground) 100%);
        }
        .lifestyle-hero .path {
          position:absolute; left:-5%; right:-5%; bottom:8%; height:2px; background: rgba(120,60,40,.25);
          transform: rotate(-1.2deg);
        }
        .lifestyle-hero[data-phase="dinner"] .path,
        .lifestyle-hero[data-phase="night"] .path { background: rgba(200,215,255,.15); }

        /* Street lamps — dusk/night */
        .lifestyle-hero .lamp {
          position:absolute; bottom:6%; width:6px; height:170px;
          background: linear-gradient(180deg, #2a3040 0%, #1a1e2a 100%);
          border-radius:2px;
          opacity: 0; transition: opacity 1.2s ease;
        }
        .lifestyle-hero[data-phase="evening"] .lamp,
        .lifestyle-hero[data-phase="dinner"] .lamp,
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
          50% { filter: brightness(.82); }
          52% { filter: brightness(1.02); }
        }
        .lifestyle-hero .lamp-1 { left: 14%; }
        .lifestyle-hero .lamp-2 { left: 60%; height:140px; }
        .lifestyle-hero .lamp-3 { left: 86%; height:180px; }

        /* Fireflies — dinner/night */
        .lifestyle-hero .fly {
          position:absolute; width:5px; height:5px; border-radius:50%;
          background: #ffe089; box-shadow: 0 0 10px #ffcf5a, 0 0 22px rgba(255,207,90,.5);
          opacity:0; animation: ls-fly 9s ease-in-out infinite;
        }
        .lifestyle-hero[data-phase="dinner"] .fly,
        .lifestyle-hero[data-phase="night"] .fly { opacity:1; }
        .lifestyle-hero .fly.f2 { animation-delay:-2s; animation-duration:11s; }
        .lifestyle-hero .fly.f3 { animation-delay:-5s; animation-duration:8s; }
        .lifestyle-hero .fly.f4 { animation-delay:-7s; animation-duration:12s; }
        @keyframes ls-fly {
          0%   { transform: translate(0,0); }
          25%  { transform: translate(30px, -20px); }
          50%  { transform: translate(-10px, -40px); }
          75%  { transform: translate(20px, -15px); }
          100% { transform: translate(0,0); }
        }

        /* Human figures — contextual by phase */
        .lifestyle-hero .fig { position:absolute; bottom:12%; width:60px; height:110px; opacity:0; transition: opacity 1s ease; }
        .lifestyle-hero .fig svg { width:100%; height:100%; overflow:visible; }
        .lifestyle-hero .fig .body { fill:none; stroke: var(--ink); stroke-width:2.5; stroke-linecap:round; stroke-linejoin:round; }
        .lifestyle-hero .fig .head { fill: var(--ink); }

        /* Show figures per phase */
        .lifestyle-hero[data-phase="earlyMorning"] .fig-jog,
        .lifestyle-hero[data-phase="earlyMorning"] .fig-yoga,
        .lifestyle-hero[data-phase="lateMorning"] .fig-walk,
        .lifestyle-hero[data-phase="midday"] .fig-eat,
        .lifestyle-hero[data-phase="afternoon"] .fig-walk,
        .lifestyle-hero[data-phase="afternoon"] .fig-yoga,
        .lifestyle-hero[data-phase="evening"] .fig-jog,
        .lifestyle-hero[data-phase="evening"] .fig-yoga,
        .lifestyle-hero[data-phase="dinner"] .fig-eat,
        .lifestyle-hero[data-phase="night"] .fig-sleep { opacity:.9; }

        .lifestyle-hero .fig-yoga { left:14%; animation: ls-breathe 4s ease-in-out infinite; transform-origin:center bottom; }
        .lifestyle-hero .fig-walk { left:44%; animation: ls-walk 24s linear infinite; }
        .lifestyle-hero .fig-jog  { left:70%; animation: ls-jog 16s linear infinite; }
        .lifestyle-hero .fig-eat  { left:50%; bottom:14%; }
        .lifestyle-hero .fig-sleep { left:46%; bottom:16%; width:100px; height:70px; }

        @keyframes ls-breathe { 0%,100% { transform: scale(1);} 50% { transform: scale(1.05);} }
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
        .lifestyle-hero .fig-yoga .arm-l, .lifestyle-hero .fig-yoga .arm-r,
        .lifestyle-hero .fig-eat .arm-r,
        .lifestyle-hero .fig-sleep * { animation: none; }
        .lifestyle-hero .fig-eat .arm-r { animation: ls-eat 2.4s ease-in-out infinite; transform-origin: 30px 30px; }
        @keyframes ls-eat {
          0%,100% { transform: rotate(0deg); }
          50% { transform: rotate(-40deg); }
        }
        @keyframes ls-limb { from { transform: rotate(-14deg);} to { transform: rotate(14deg);} }

        @media (prefers-reduced-motion: reduce) {
          .lifestyle-hero .cloud, .lifestyle-hero .fig, .lifestyle-hero .fig *,
          .lifestyle-hero .fig-yoga, .lifestyle-hero .star, .lifestyle-hero .lamp::after,
          .lifestyle-hero .bird, .lifestyle-hero .leaf, .lifestyle-hero .steam,
          .lifestyle-hero .fly, .lifestyle-hero .shoot, .lifestyle-hero .rays { animation: none !important; }
        }
      `}</style>

      <div className="sky" />
      {showSun && <div className="sun" />}
      <div className="rays" />
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
      <div className="shoot" />

      <div className="cloud" style={{ left: "10%" }} />
      <div className="cloud c2" style={{ left: "45%" }} />
      <div className="cloud c3" style={{ left: "60%" }} />

      {/* Birds — early morning */}
      <div className="bird" style={{ top: "22%" }}>~^~</div>
      <div className="bird b2" style={{ top: "26%" }}>~^~</div>
      <div className="bird b3" style={{ top: "30%" }}>~^~</div>

      {/* Falling leaves — afternoon */}
      <div className="leaf" style={{ left: "20%" }} />
      <div className="leaf l2" style={{ left: "45%" }} />
      <div className="leaf l3" style={{ left: "68%" }} />
      <div className="leaf l4" style={{ left: "82%" }} />

      {/* Steam curls — midday / dinner */}
      <div className="steam" style={{ left: "48%" }} />
      <div className="steam s2" style={{ left: "51%" }} />
      <div className="steam s3" style={{ left: "54%" }} />

      {/* Office windows — late morning */}
      <div className="windows" />

      <div className="ground" />
      <div className="path" />

      <div className="lamp lamp-1" />
      <div className="lamp lamp-2" />
      <div className="lamp lamp-3" />

      {/* Fireflies — dinner/night */}
      <div className="fly" style={{ left: "22%", bottom: "26%" }} />
      <div className="fly f2" style={{ left: "38%", bottom: "34%" }} />
      <div className="fly f3" style={{ left: "66%", bottom: "22%" }} />
      <div className="fly f4" style={{ left: "80%", bottom: "30%" }} />

      {/* Figures */}
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

      {/* Eating (seated at plate) */}
      <div className="fig fig-eat">
        <svg viewBox="0 0 60 110">
          <circle className="head" cx="24" cy="18" r="7" />
          <path className="body" d="M24 26 L24 60" />
          <path className="body arm-l" d="M24 34 L10 46" />
          <path className="body arm-r" d="M24 34 L38 30" />
          <path className="body" d="M24 60 L14 88" />
          <path className="body" d="M24 60 L36 88" />
          {/* table + plate */}
          <path className="body" d="M6 78 L54 78" />
          <ellipse className="body" cx="40" cy="72" rx="10" ry="3" />
        </svg>
      </div>

      {/* Sleeping figure — pillow + blanket */}
      <div className="fig fig-sleep">
        <svg viewBox="0 0 100 70">
          <path className="body" d="M6 60 L94 60" />
          <path className="body" d="M18 60 Q22 46 34 46 L78 46 Q86 46 86 60" />
          <circle className="head" cx="30" cy="42" r="8" />
          <text x="60" y="24" fontSize="14" fill="var(--ink)" opacity=".7">z</text>
          <text x="72" y="14" fontSize="10" fill="var(--ink)" opacity=".7">z</text>
        </svg>
      </div>

      <span className="sr-only">{isNight ? "night" : isDusk ? "dusk" : "day"}</span>
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
