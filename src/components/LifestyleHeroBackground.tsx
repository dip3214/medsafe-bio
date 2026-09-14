import { useEffect, useMemo, useRef, useState } from "react";
import { phaseForHour, type LifestylePhase } from "@/lib/lifestyle-context";
import type { Weather } from "@/lib/use-weather";
import lifestyleIndia from "@/assets/lifestyle-india.jpg";

export function LifestyleHeroBackground({
  phase: phaseProp,
  weather,
}: { phase?: LifestylePhase; weather?: Weather | null } = {}) {
  const [autoPhase, setAutoPhase] = useState<LifestylePhase>(() => phaseForHour(new Date().getHours()));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phaseProp) return;
    const t = setInterval(() => setAutoPhase(phaseForHour(new Date().getHours())), 60_000);
    return () => clearInterval(t);
  }, [phaseProp]);

  // Parallax — subtle mouse drift on sky elements
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", nx.toFixed(3));
        el.style.setProperty("--my", ny.toFixed(3));
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const phase = phaseProp ?? autoPhase;
  const isDusk = phase === "evening";
  const isNight = phase === "dinner" || phase === "night";
  const showSun = phase === "earlyMorning" || phase === "lateMorning" || phase === "midday" || phase === "afternoon";

  // Weather-driven flags. `overcast` = extra clouds when raining/thunder/very cloudy.
  const weatherKind: "clear" | "clouds" | "rain" | "snow" | "thunder" | "fog" =
    weather?.condition ?? "clear";
  const showRain = weatherKind === "rain" || weatherKind === "thunder";
  const showSnow = weatherKind === "snow";
  const overcast = weatherKind !== "clear" && weatherKind !== "fog";
  const extraClouds = weather?.willRainSoon || weather?.isCloudy || false;

  const raindrops = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({
      left: (i * 97) % 100,
      delay: ((i * 173) % 100) / 100,
      dur: 0.6 + ((i * 53) % 40) / 100,
    })),
    [],
  );
  const snowflakes = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({
      left: (i * 61) % 100,
      delay: ((i * 137) % 100) / 20,
      dur: 6 + ((i * 41) % 50) / 10,
      drift: ((i * 29) % 40) - 20,
    })),
    [],
  );

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-phase={phase}
      data-weather={weatherKind}
      className="lifestyle-hero pointer-events-none absolute inset-0 overflow-hidden"
      style={{ ["--mx" as any]: 0, ["--my" as any]: 0 }}
    >
      <style>{`
        .lifestyle-hero { transition: background 1.2s ease; background: var(--foreground); }
        .lifestyle-hero .photo {
          position:absolute; inset:-3%; width:106%; height:106%; object-fit:cover;
          animation: ls-camera 18s ease-in-out infinite alternate;
          filter: saturate(.92) contrast(.96);
        }
        .lifestyle-hero .photo-tint {
          position:absolute; inset:0;
          background: linear-gradient(90deg, color-mix(in oklab, var(--foreground) 68%, transparent) 0%, color-mix(in oklab, var(--foreground) 20%, transparent) 48%, transparent 78%), linear-gradient(0deg, color-mix(in oklab, var(--foreground) 30%, transparent), transparent 55%);
        }
        @keyframes ls-camera { from { transform:scale(1.02) translate3d(-.5%,0,0); } to { transform:scale(1.08) translate3d(1.5%,-1%,0); } }

        /* Palettes */
        .lifestyle-hero[data-phase="earlyMorning"] { --sky-1:#ffd7b4; --sky-2:#ffb197; --sky-3:#f0d9c2; --ink:rgba(60,25,20,.6); --ground:rgba(30,15,10,.18); --aurora:transparent; }
        .lifestyle-hero[data-phase="lateMorning"]  { --sky-1:#c9e6ff; --sky-2:#e6f3ff; --sky-3:#f0ebe0; --ink:rgba(30,40,55,.55); --ground:rgba(30,40,60,.14); --aurora:transparent; }
        .lifestyle-hero[data-phase="midday"]       { --sky-1:#9ed2ff; --sky-2:#cfe8ff; --sky-3:#f4ecd6; --ink:rgba(25,40,60,.5); --ground:rgba(20,35,55,.12); --aurora:transparent; }
        .lifestyle-hero[data-phase="afternoon"]    { --sky-1:#ffd39c; --sky-2:#ffb877; --sky-3:#e9c9a0; --ink:rgba(80,40,20,.55); --ground:rgba(70,35,20,.16); --aurora:transparent; }
        .lifestyle-hero[data-phase="evening"]      { --sky-1:#ff7a5a; --sky-2:#a04a72; --sky-3:#2a1f42; --ink:rgba(255,225,200,.85); --ground:rgba(20,10,25,.55); --aurora:rgba(255,140,120,.15); }
        .lifestyle-hero[data-phase="dinner"]       { --sky-1:#1a1f3f; --sky-2:#141530; --sky-3:#08091b; --ink:rgba(230,220,255,.9); --ground:rgba(0,0,0,.65); --aurora:rgba(120,180,255,.16); }
        .lifestyle-hero[data-phase="night"]        { --sky-1:#0a1128; --sky-2:#050a1c; --sky-3:#02040c; --ink:rgba(220,230,255,.9); --ground:rgba(0,0,0,.8); --aurora:rgba(140,220,200,.14); }

        .lifestyle-hero .sky {
          position:absolute; inset:-4%;
          background: linear-gradient(180deg, var(--sky-1) 0%, var(--sky-2) 55%, var(--sky-3) 100%);
          transition: background 1.2s ease; opacity:.34; mix-blend-mode:soft-light;
          transform: translate3d(calc(var(--mx) * -8px), calc(var(--my) * -6px), 0);
        }

        /* Animated aurora band for evening/night */
        .lifestyle-hero .aurora {
          position:absolute; inset:0; pointer-events:none; mix-blend-mode: screen;
          background:
            radial-gradient(60% 40% at 20% 30%, var(--aurora), transparent 60%),
            radial-gradient(50% 35% at 75% 25%, var(--aurora), transparent 60%);
          filter: blur(20px); opacity:.9;
          animation: ls-aurora 18s ease-in-out infinite;
        }
        @keyframes ls-aurora {
          0%,100% { transform: translateX(-3%) scale(1); opacity:.7; }
          50%     { transform: translateX(3%)  scale(1.1); opacity:1; }
        }

        /* Sun — positioned by phase, with breathing halo */
        .lifestyle-hero .sun-wrap {
          position:absolute; width:150px; height:150px; opacity:0; pointer-events:none;
          transition: opacity 1.2s ease, left 1.8s cubic-bezier(.4,0,.2,1), top 1.8s cubic-bezier(.4,0,.2,1);
          transform: translate3d(calc(var(--mx) * -14px), calc(var(--my) * -10px), 0);
        }
        .lifestyle-hero .sun {
          position:absolute; inset:10px; border-radius:50%;
          background: radial-gradient(circle, rgba(255,240,215,.98), rgba(255,190,140,.6) 55%, transparent 72%);
          filter: blur(2px);
          animation: ls-sun-pulse 6s ease-in-out infinite;
        }
        .lifestyle-hero .sun-halo {
          position:absolute; inset:-20px; border-radius:50%;
          background: radial-gradient(circle, rgba(255,220,170,.35), transparent 65%);
          animation: ls-sun-halo 8s ease-in-out infinite;
        }
        @keyframes ls-sun-pulse { 0%,100% { transform: scale(1);} 50% { transform: scale(1.05);} }
        @keyframes ls-sun-halo  { 0%,100% { transform: scale(1); opacity:.7;} 50% { transform: scale(1.15); opacity:1;} }

        .lifestyle-hero[data-phase="earlyMorning"] .sun-wrap { left:8%;  top:34%; opacity:1; }
        .lifestyle-hero[data-phase="lateMorning"]  .sun-wrap { left:32%; top:12%; opacity:1; }
        .lifestyle-hero[data-phase="midday"]       .sun-wrap { left:50%; top:4%;  opacity:1; }
        .lifestyle-hero[data-phase="afternoon"]    .sun-wrap { left:70%; top:20%; opacity:.95; }
        .lifestyle-hero[data-phase="midday"] .sun {
          background: radial-gradient(circle, rgba(255,252,230,1), rgba(255,225,150,.6) 55%, transparent 72%);
        }
        .lifestyle-hero[data-phase="afternoon"] .sun {
          background: radial-gradient(circle, rgba(255,205,150,.98), rgba(230,120,80,.55) 55%, transparent 72%);
        }

        /* Sun rays for midday */
        .lifestyle-hero .rays {
          position:absolute; left:47%; top:-2%; width:200px; height:200px;
          opacity: 0; transition: opacity 1.2s ease;
          background: conic-gradient(from 0deg,
            rgba(255,240,180,0) 0deg, rgba(255,240,180,.4) 6deg, rgba(255,240,180,0) 12deg,
            rgba(255,240,180,0) 40deg, rgba(255,240,180,.3) 46deg, rgba(255,240,180,0) 52deg,
            rgba(255,240,180,0) 80deg, rgba(255,240,180,.3) 86deg, rgba(255,240,180,0) 92deg,
            rgba(255,240,180,0) 120deg, rgba(255,240,180,.3) 126deg, rgba(255,240,180,0) 132deg,
            rgba(255,240,180,0) 160deg, rgba(255,240,180,.3) 166deg, rgba(255,240,180,0) 172deg,
            rgba(255,240,180,0) 200deg, rgba(255,240,180,.3) 206deg, rgba(255,240,180,0) 212deg,
            rgba(255,240,180,0) 240deg, rgba(255,240,180,.3) 246deg, rgba(255,240,180,0) 252deg,
            rgba(255,240,180,0) 280deg, rgba(255,240,180,.3) 286deg, rgba(255,240,180,0) 292deg,
            rgba(255,240,180,0) 320deg, rgba(255,240,180,.3) 326deg, rgba(255,240,180,0) 332deg,
            rgba(255,240,180,0) 360deg);
          border-radius:50%;
          animation: ls-spin 60s linear infinite;
          mix-blend-mode: screen;
        }
        .lifestyle-hero[data-phase="midday"] .rays { opacity:.75; }
        @keyframes ls-spin { to { transform: rotate(360deg); } }

        /* Floating dust motes — day only, drifting slowly */
        .lifestyle-hero .mote {
          position:absolute; width:4px; height:4px; border-radius:50%;
          background: rgba(255,250,220,.85); box-shadow: 0 0 8px rgba(255,240,190,.7);
          opacity:0; animation: ls-mote 12s linear infinite;
        }
        .lifestyle-hero[data-phase="lateMorning"] .mote,
        .lifestyle-hero[data-phase="midday"] .mote,
        .lifestyle-hero[data-phase="afternoon"] .mote { opacity:.85; }
        @keyframes ls-mote {
          0%   { transform: translate(0,0) scale(.6); opacity:0; }
          20%  { opacity:.9; }
          100% { transform: translate(60px, -180px) scale(1); opacity:0; }
        }

        /* Moon with crater detail */
        .lifestyle-hero .moon {
          position:absolute; left:78%; top:12%; width:92px; height:92px; border-radius:50%;
          background: radial-gradient(circle at 35% 35%, #f8f4e0, #d4d9e4 60%, #8e98ac 100%);
          box-shadow: 0 0 60px rgba(230,235,255,.4), inset -8px -12px 20px rgba(0,0,0,.2);
          opacity:0; transition: opacity 1.2s ease;
          transform: translate3d(calc(var(--mx) * -14px), calc(var(--my) * -10px), 0);
        }
        .lifestyle-hero .moon::before,
        .lifestyle-hero .moon::after {
          content:""; position:absolute; border-radius:50%; background: rgba(120,130,150,.3);
        }
        .lifestyle-hero .moon::before { width:14px; height:14px; top:30%; left:30%; }
        .lifestyle-hero .moon::after  { width:8px;  height:8px;  top:55%; left:55%; }
        .lifestyle-hero[data-phase="dinner"] .moon,
        .lifestyle-hero[data-phase="night"] .moon { opacity:1; }
        /* Moon glow ring */
        .lifestyle-hero .moon-glow {
          position:absolute; left:74%; top:8%; width:140px; height:140px; border-radius:50%;
          background: radial-gradient(circle, rgba(220,230,255,.25), transparent 65%);
          opacity:0; transition: opacity 1.2s ease;
          animation: ls-sun-halo 10s ease-in-out infinite;
        }
        .lifestyle-hero[data-phase="dinner"] .moon-glow,
        .lifestyle-hero[data-phase="night"] .moon-glow { opacity:1; }

        /* Stars */
        .lifestyle-hero .stars { position:absolute; inset:0; opacity:0; transition: opacity 1.2s ease;
          transform: translate3d(calc(var(--mx) * -6px), calc(var(--my) * -4px), 0); }
        .lifestyle-hero[data-phase="evening"] .stars { opacity:.5; }
        .lifestyle-hero[data-phase="dinner"] .stars,
        .lifestyle-hero[data-phase="night"] .stars { opacity:1; }
        .lifestyle-hero .star {
          position:absolute; width:2px; height:2px; border-radius:50%;
          background:#fff; box-shadow:0 0 4px rgba(255,255,255,.9);
          animation: ls-twinkle 3s ease-in-out infinite;
        }
        .lifestyle-hero .star.big { width:3px; height:3px; box-shadow:0 0 8px #fff, 0 0 16px rgba(200,220,255,.7); }
        @keyframes ls-twinkle {
          0%,100% { opacity:.3; transform:scale(1); }
          50% { opacity:1; transform:scale(1.6); }
        }
        /* Shooting star */
        .lifestyle-hero .shoot {
          position:absolute; top:18%; left:-10%; width:140px; height:2px;
          background: linear-gradient(90deg, transparent, #fff, transparent);
          filter: drop-shadow(0 0 4px #fff);
          opacity:0; transform: rotate(-18deg);
        }
        .lifestyle-hero[data-phase="night"] .shoot { animation: ls-shoot 9s linear infinite; }
        .lifestyle-hero[data-phase="dinner"] .shoot { animation: ls-shoot 14s linear infinite; }
        @keyframes ls-shoot {
          0%   { transform: translate(0,0) rotate(-18deg); opacity:0; }
          6%   { opacity:1; }
          22%  { transform: translate(90vw, 28vh) rotate(-18deg); opacity:0; }
          100% { opacity:0; }
        }

        /* Clouds */
        .lifestyle-hero .cloud {
          position:absolute; top:12%; width:180px; height:44px; border-radius:999px;
          background: rgba(255,255,255,.72); filter: blur(1px);
          animation: ls-drift 60s linear infinite;
          opacity: 0; transition: opacity 1.2s ease;
        }
        .lifestyle-hero .cloud::before, .lifestyle-hero .cloud::after {
          content:""; position:absolute; background: inherit; border-radius:50%;
        }
        .lifestyle-hero .cloud::before { width:70px; height:70px; top:-30px; left:30px; }
        .lifestyle-hero .cloud::after  { width:90px; height:90px; top:-50px; left:80px; }
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
          position:absolute; font-size: 18px; color: rgba(50,25,20,.6); letter-spacing: -2px;
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
          background: rgba(180,80,40,.7);
          opacity:0; animation: ls-leaf 14s linear infinite;
        }
        .lifestyle-hero[data-phase="afternoon"] .leaf { opacity:1; }
        .lifestyle-hero .leaf.l2 { animation-delay:-4s; background: rgba(200,120,50,.65); }
        .lifestyle-hero .leaf.l3 { animation-delay:-8s; background: rgba(160,70,40,.65); }
        .lifestyle-hero .leaf.l4 { animation-delay:-11s; background: rgba(220,150,70,.65); }
        @keyframes ls-leaf {
          0%   { transform: translate(0, 0) rotate(0deg); }
          50%  { transform: translate(3vw, 40vh) rotate(180deg); }
          100% { transform: translate(6vw, 80vh) rotate(360deg); }
        }

        /* Steam */
        .lifestyle-hero .steam {
          position:absolute; bottom:22%; width:6px; height:40px; border-radius:6px;
          background: linear-gradient(180deg, rgba(255,255,255,.8), rgba(255,255,255,0));
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

        /* Window lights */
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

        /* Distant mountains */
        .lifestyle-hero .mountains {
          position:absolute; left:0; right:0; bottom:32%; height:22%;
          background:
            radial-gradient(60% 100% at 20% 100%, rgba(70,60,80,.55) 0 60%, transparent 61%),
            radial-gradient(55% 100% at 55% 100%, rgba(55,45,70,.65) 0 60%, transparent 61%),
            radial-gradient(65% 100% at 88% 100%, rgba(60,50,80,.55) 0 60%, transparent 61%);
          filter: blur(.3px);
          transform: translate3d(calc(var(--mx) * 4px), 0, 0);
        }
        .lifestyle-hero[data-phase="dinner"] .mountains,
        .lifestyle-hero[data-phase="night"] .mountains {
          background:
            radial-gradient(60% 100% at 20% 100%, rgba(10,15,30,.85) 0 60%, transparent 61%),
            radial-gradient(55% 100% at 55% 100%, rgba(5,10,25,.9) 0 60%, transparent 61%),
            radial-gradient(65% 100% at 88% 100%, rgba(10,15,30,.85) 0 60%, transparent 61%);
        }

        /* City skyline */
        .lifestyle-hero .skyline {
          position:absolute; left:0; right:0; bottom:28%; height:14%;
          background:
            linear-gradient(180deg, transparent 0, transparent 20%, rgba(30,25,45,.55) 20%, rgba(30,25,45,.55) 100%);
          -webkit-mask: repeating-linear-gradient(90deg,
            #000 0 22px, transparent 22px 30px, #000 30px 66px, transparent 66px 74px,
            #000 74px 102px, transparent 102px 112px, #000 112px 158px, transparent 158px 168px);
                  mask: repeating-linear-gradient(90deg,
            #000 0 22px, transparent 22px 30px, #000 30px 66px, transparent 66px 74px,
            #000 74px 102px, transparent 102px 112px, #000 112px 158px, transparent 158px 168px);
          opacity:.7;
          transform: translate3d(calc(var(--mx) * 6px), 0, 0);
        }
        .lifestyle-hero[data-phase="dinner"] .skyline,
        .lifestyle-hero[data-phase="night"] .skyline {
          background: linear-gradient(180deg, transparent 0, transparent 20%, rgba(5,8,20,.95) 20%, rgba(5,8,20,.95) 100%);
        }
        .lifestyle-hero .skyline::after {
          content:""; position:absolute; inset:20% 0 0 0; opacity:0; transition: opacity 1s ease;
          background:
            radial-gradient(2px 2px at 12% 40%, #ffd27a 60%, transparent 61%),
            radial-gradient(2px 2px at 18% 60%, #ffd27a 60%, transparent 61%),
            radial-gradient(2px 2px at 36% 30%, #ffd27a 60%, transparent 61%),
            radial-gradient(2px 2px at 42% 70%, #ffd27a 60%, transparent 61%),
            radial-gradient(2px 2px at 58% 45%, #ffd27a 60%, transparent 61%),
            radial-gradient(2px 2px at 72% 35%, #ffd27a 60%, transparent 61%),
            radial-gradient(2px 2px at 78% 65%, #ffd27a 60%, transparent 61%),
            radial-gradient(2px 2px at 90% 50%, #ffd27a 60%, transparent 61%);
          animation: ls-flicker-windows 6s ease-in-out infinite;
        }
        @keyframes ls-flicker-windows { 0%,100% { filter:brightness(1);} 50% { filter:brightness(1.3);} }
        .lifestyle-hero[data-phase="evening"] .skyline::after { opacity:.6; }
        .lifestyle-hero[data-phase="dinner"] .skyline::after,
        .lifestyle-hero[data-phase="night"] .skyline::after { opacity:1; }

        /* Tree line */
        .lifestyle-hero .trees {
          position:absolute; left:0; right:0; bottom:22%; height:16%;
          background:
            radial-gradient(28px 40px at 6% 100%, rgba(40,60,40,.85) 60%, transparent 62%),
            radial-gradient(20px 32px at 12% 100%, rgba(50,70,50,.8) 60%, transparent 62%),
            radial-gradient(34px 46px at 22% 100%, rgba(35,55,40,.85) 60%, transparent 62%),
            radial-gradient(22px 34px at 32% 100%, rgba(45,65,45,.8) 60%, transparent 62%),
            radial-gradient(30px 44px at 78% 100%, rgba(35,55,40,.85) 60%, transparent 62%),
            radial-gradient(24px 36px at 88% 100%, rgba(50,70,50,.8) 60%, transparent 62%),
            radial-gradient(32px 44px at 96% 100%, rgba(40,60,40,.85) 60%, transparent 62%);
          animation: ls-sway 8s ease-in-out infinite;
          transform-origin: bottom center;
        }
        @keyframes ls-sway { 0%,100% { transform: skewX(-1deg);} 50% { transform: skewX(1deg);} }
        .lifestyle-hero[data-phase="dinner"] .trees,
        .lifestyle-hero[data-phase="night"] .trees { filter: brightness(.35); }

        /* Grass blades swaying */
        .lifestyle-hero .grass {
          position:absolute; left:0; right:0; bottom:0; height:24%; pointer-events:none;
          background:
            repeating-linear-gradient(90deg,
              transparent 0 8px,
              rgba(60,90,50,.35) 8px 9px,
              transparent 9px 16px);
          -webkit-mask: linear-gradient(180deg, transparent 40%, #000 60%);
                  mask: linear-gradient(180deg, transparent 40%, #000 60%);
          animation: ls-grass 4s ease-in-out infinite;
          transform-origin: bottom;
        }
        @keyframes ls-grass { 0%,100% { transform: skewX(-2deg);} 50% { transform: skewX(2deg);} }
        .lifestyle-hero[data-phase="dinner"] .grass,
        .lifestyle-hero[data-phase="night"] .grass { filter: brightness(.4); }

        /* Ground + path */
        .lifestyle-hero .ground {
          position:absolute; left:0; right:0; bottom:0; height:24%;
          background:
            linear-gradient(180deg, transparent 0%, var(--ground) 30%, var(--ground) 100%),
            repeating-linear-gradient(90deg, rgba(0,0,0,.03) 0 6px, transparent 6px 12px);
        }
        .lifestyle-hero .path {
          position:absolute; left:-5%; right:-5%; bottom:8%; height:8px;
          background: linear-gradient(180deg, rgba(120,80,55,.35), rgba(90,55,35,.4));
          border-radius: 40%;
          transform: rotate(-1.2deg);
        }
        .lifestyle-hero[data-phase="dinner"] .path,
        .lifestyle-hero[data-phase="night"] .path { background: linear-gradient(180deg, rgba(200,215,255,.18), rgba(160,180,220,.22)); }

        /* Street lamps */
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

        /* Fireflies */
        .lifestyle-hero .fly {
          position:absolute; width:5px; height:5px; border-radius:50%;
          background: #ffe089; box-shadow: 0 0 12px #ffcf5a, 0 0 26px rgba(255,207,90,.55);
          opacity:0; animation: ls-fly 9s ease-in-out infinite;
        }
        .lifestyle-hero[data-phase="evening"] .fly { opacity:.6; }
        .lifestyle-hero[data-phase="dinner"] .fly,
        .lifestyle-hero[data-phase="night"] .fly { opacity:1; }
        .lifestyle-hero .fly.f2 { animation-delay:-2s; animation-duration:11s; }
        .lifestyle-hero .fly.f3 { animation-delay:-5s; animation-duration:8s; }
        .lifestyle-hero .fly.f4 { animation-delay:-7s; animation-duration:12s; }
        .lifestyle-hero .fly.f5 { animation-delay:-3s; animation-duration:14s; }
        .lifestyle-hero .fly.f6 { animation-delay:-9s; animation-duration:10s; }
        @keyframes ls-fly {
          0%   { transform: translate(0,0); }
          25%  { transform: translate(40px, -30px); }
          50%  { transform: translate(-20px, -55px); }
          75%  { transform: translate(30px, -20px); }
          100% { transform: translate(0,0); }
        }

        /* Figures */
        .lifestyle-hero .fig { position:absolute; bottom:12%; width:70px; height:120px; opacity:0; transition: opacity 1s ease; filter: drop-shadow(0 6px 6px rgba(0,0,0,.25)); }
        .lifestyle-hero .fig svg { width:100%; height:100%; overflow:visible; }
        .lifestyle-hero .fig .body { fill:none; stroke: var(--ink); stroke-width:2.5; stroke-linecap:round; stroke-linejoin:round; }
        .lifestyle-hero .fig .head { fill: #e8b58a; stroke: rgba(0,0,0,.35); stroke-width:1; }
        .lifestyle-hero .fig .hair { fill: #2b1e15; }
        .lifestyle-hero .fig .shirt { fill: #c4654a; }
        .lifestyle-hero .fig .shirt-alt { fill: #3f6b9c; }
        .lifestyle-hero .fig .pants { fill: #2d3748; }
        .lifestyle-hero .fig .shoe { fill: #1a1a1a; }
        .lifestyle-hero[data-phase="dinner"] .fig,
        .lifestyle-hero[data-phase="night"] .fig { filter: drop-shadow(0 4px 6px rgba(0,0,0,.5)) brightness(.7); }

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
        @keyframes ls-eat { 0%,100% { transform: rotate(0deg);} 50% { transform: rotate(-40deg);} }
        @keyframes ls-limb { from { transform: rotate(-14deg);} to { transform: rotate(14deg);} }

        /* Soft vignette to add depth */
        .lifestyle-hero .vignette {
          position:absolute; inset:0; pointer-events:none;
          background: radial-gradient(120% 80% at 50% 40%, transparent 55%, rgba(0,0,0,.35) 100%);
        }

        @media (prefers-reduced-motion: reduce) {
          .lifestyle-hero .cloud, .lifestyle-hero .fig, .lifestyle-hero .fig *,
          .lifestyle-hero .fig-yoga, .lifestyle-hero .star, .lifestyle-hero .lamp::after,
          .lifestyle-hero .bird, .lifestyle-hero .leaf, .lifestyle-hero .steam,
          .lifestyle-hero .fly, .lifestyle-hero .shoot, .lifestyle-hero .rays,
          .lifestyle-hero .aurora, .lifestyle-hero .sun, .lifestyle-hero .sun-halo,
          .lifestyle-hero .mote, .lifestyle-hero .grass, .lifestyle-hero .trees, .lifestyle-hero .photo { animation: none !important; }
        }

        /* ===== Weather layers ===== */
        /* Overcast: darken the sky a touch when clouds/rain roll in */
        .lifestyle-hero[data-weather="clouds"] .sky,
        .lifestyle-hero[data-weather="fog"] .sky { filter: brightness(.92) saturate(.9); }
        .lifestyle-hero[data-weather="rain"] .sky,
        .lifestyle-hero[data-weather="thunder"] .sky { filter: brightness(.72) saturate(.85) hue-rotate(-8deg); }
        .lifestyle-hero[data-weather="snow"] .sky { filter: brightness(1.02) saturate(.7); }
        /* Fade the sun when it's not visible in reality */
        .lifestyle-hero[data-weather="rain"] .sun-wrap,
        .lifestyle-hero[data-weather="thunder"] .sun-wrap,
        .lifestyle-hero[data-weather="clouds"] .sun-wrap { opacity: .35 !important; filter: blur(2px); }
        .lifestyle-hero[data-weather="rain"] .rays,
        .lifestyle-hero[data-weather="thunder"] .rays,
        .lifestyle-hero[data-weather="clouds"] .rays { opacity: 0 !important; }

        /* Extra low, wide storm clouds */
        .lifestyle-hero .wx-cloud {
          position:absolute; top:6%; width:260px; height:70px; border-radius:60px;
          background: radial-gradient(ellipse at 30% 40%, rgba(240,240,245,.95), rgba(180,185,195,.85) 55%, rgba(120,125,140,.55) 100%);
          filter: blur(1px);
          opacity:0; transition: opacity 1.2s ease;
          animation: ls-cloud-drift 90s linear infinite;
        }
        .lifestyle-hero .wx-cloud.b { top:14%; width:320px; height:80px; animation-duration: 130s; opacity:.9; }
        .lifestyle-hero .wx-cloud.c { top:2%;  width:200px; height:55px; animation-duration: 110s; }
        .lifestyle-hero[data-weather="clouds"] .wx-cloud,
        .lifestyle-hero[data-weather="fog"] .wx-cloud { opacity:.85; }
        .lifestyle-hero[data-weather="rain"] .wx-cloud,
        .lifestyle-hero[data-weather="thunder"] .wx-cloud { opacity:1; filter: blur(1px) brightness(.7); }
        .lifestyle-hero[data-weather="snow"] .wx-cloud { opacity:.9; filter: blur(1px) brightness(1.05); }
        @keyframes ls-cloud-drift {
          0% { transform: translateX(-30vw); }
          100% { transform: translateX(120vw); }
        }

        /* Rain */
        .lifestyle-hero .rain { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
        .lifestyle-hero .drop {
          position:absolute; top:-10%; width:1.5px; height:22px; border-radius:1px;
          background: linear-gradient(180deg, rgba(180,210,240,0), rgba(200,220,245,.85));
          animation: ls-rain linear infinite;
        }
        @keyframes ls-rain {
          0%   { transform: translateY(-10vh); opacity:0; }
          10%  { opacity:1; }
          100% { transform: translateY(120vh); opacity:0; }
        }

        /* Lightning flash on thunder */
        .lifestyle-hero[data-weather="thunder"] .flash {
          position:absolute; inset:0; background: rgba(255,255,255,.85); opacity:0;
          animation: ls-flash 7s ease-out infinite;
        }
        @keyframes ls-flash {
          0%, 92%, 100% { opacity:0; }
          93% { opacity:.7; }
          94% { opacity:.1; }
          95% { opacity:.55; }
          97% { opacity:0; }
        }

        /* Snow */
        .lifestyle-hero .snow { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
        .lifestyle-hero .flake {
          position:absolute; top:-5%; width:6px; height:6px; border-radius:50%;
          background: rgba(255,255,255,.9); box-shadow: 0 0 4px rgba(255,255,255,.7);
          animation: ls-snow linear infinite;
        }
        @keyframes ls-snow {
          0%   { transform: translate(0, -5vh) rotate(0deg); opacity:0; }
          10%  { opacity:1; }
          100% { transform: translate(var(--drift, 0px), 120vh) rotate(360deg); opacity:.4; }
        }

        @media (prefers-reduced-motion: reduce) {
          .lifestyle-hero .drop, .lifestyle-hero .flake,
          .lifestyle-hero .wx-cloud, .lifestyle-hero .flash { animation: none !important; }
        }
      `}</style>

      <img src={lifestyleIndia} alt="" className="photo" width={1600} height={1000} />
      <div className="sky" />
      <div className="photo-tint" />
      <div className="aurora" />
      {showSun && (
        <div className="sun-wrap">
          <div className="sun-halo" />
          <div className="sun" />
        </div>
      )}
      <div className="rays" />
      <div className="moon-glow" />
      <div className="moon" />

      <div className="stars">
        {STAR_POSITIONS.map((s, i) => (
          <span
            key={i}
            className={`star ${i % 4 === 0 ? "big" : ""}`}
            style={{ left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${s.d}s` }}
          />
        ))}
      </div>
      <div className="shoot" />

      <div className="cloud" style={{ left: "10%" }} />
      <div className="cloud c2" style={{ left: "45%" }} />
      <div className="cloud c3" style={{ left: "60%" }} />

      {/* Floating dust motes — sun-lit day */}
      {MOTE_POSITIONS.map((m, i) => (
        <span
          key={`mote-${i}`}
          className="mote"
          style={{ left: `${m.x}%`, top: `${m.y}%`, animationDelay: `${m.d}s` }}
        />
      ))}

      {/* Birds */}
      <div className="bird" style={{ top: "22%" }}>~^~</div>
      <div className="bird b2" style={{ top: "26%" }}>~^~</div>
      <div className="bird b3" style={{ top: "30%" }}>~^~</div>

      {/* Falling leaves */}
      <div className="leaf" style={{ left: "20%" }} />
      <div className="leaf l2" style={{ left: "45%" }} />
      <div className="leaf l3" style={{ left: "68%" }} />
      <div className="leaf l4" style={{ left: "82%" }} />

      {/* Steam */}
      <div className="steam" style={{ left: "48%" }} />
      <div className="steam s2" style={{ left: "51%" }} />
      <div className="steam s3" style={{ left: "54%" }} />

      <div className="windows" />

      {/* Weather: extra clouds when cloudy / rain forecast */}
      {(extraClouds || overcast) && (
        <>
          <div className="wx-cloud"   style={{ left: "-20%", animationDelay: "0s" }} />
          <div className="wx-cloud b" style={{ left: "-40%", animationDelay: "-40s" }} />
          <div className="wx-cloud c" style={{ left: "-10%", animationDelay: "-70s" }} />
          <div className="wx-cloud b" style={{ left: "-60%", animationDelay: "-90s" }} />
        </>
      )}

      {/* Rain */}
      {showRain && (
        <div className="rain">
          {raindrops.map((d, i) => (
            <span
              key={`drop-${i}`}
              className="drop"
              style={{
                left: `${d.left}%`,
                animationDelay: `${d.delay}s`,
                animationDuration: `${d.dur}s`,
              }}
            />
          ))}
          {weatherKind === "thunder" && <div className="flash" />}
        </div>
      )}

      {/* Snow */}
      {showSnow && (
        <div className="snow">
          {snowflakes.map((f, i) => (
            <span
              key={`flake-${i}`}
              className="flake"
              style={{
                left: `${f.left}%`,
                animationDelay: `${f.delay}s`,
                animationDuration: `${f.dur}s`,
                ["--drift" as any]: `${f.drift}px`,
              }}
            />
          ))}
        </div>
      )}

      <div className="ground" />

      <div className="lamp lamp-1" />
      <div className="lamp lamp-2" />
      <div className="lamp lamp-3" />

      {/* Fireflies */}
      <div className="fly" style={{ left: "22%", bottom: "26%" }} />
      <div className="fly f2" style={{ left: "38%", bottom: "34%" }} />
      <div className="fly f3" style={{ left: "66%", bottom: "22%" }} />
      <div className="fly f4" style={{ left: "80%", bottom: "30%" }} />
      <div className="fly f5" style={{ left: "50%", bottom: "40%" }} />
      <div className="fly f6" style={{ left: "12%", bottom: "36%" }} />

      {/* Contextual figures are retained as subtle activity cues over the photographic scene. */}
      <div className="fig fig-yoga">
        <svg viewBox="0 0 60 120">
          <circle className="head" cx="30" cy="16" r="8" />
          <path className="hair" d="M22 12 Q30 4 38 12 Q38 8 30 6 Q22 8 22 12 Z" />
          <path className="shirt-alt" d="M22 26 L38 26 L40 54 L20 54 Z" />
          <path className="body" d="M24 28 L18 50" strokeWidth="4" />
          <path className="body" d="M36 28 L42 50" strokeWidth="4" />
          <path className="pants" d="M20 54 L14 84 L46 84 L40 54 Z" />
          <ellipse className="shoe" cx="18" cy="86" rx="8" ry="3" />
          <ellipse className="shoe" cx="42" cy="86" rx="8" ry="3" />
          <rect x="4" y="90" width="52" height="4" rx="2" fill="#8b5a3c" opacity=".7" />
        </svg>
      </div>

      <div className="fig fig-walk">
        <svg viewBox="0 0 60 120">
          <circle className="head" cx="30" cy="16" r="8" />
          <path className="hair" d="M22 14 Q22 6 30 6 Q38 6 38 14 L38 10 Q30 4 22 10 Z" />
          <path className="shirt" d="M22 26 L38 26 L40 56 L20 56 Z" />
          <path className="body arm-l" d="M22 30 L16 52" strokeWidth="4.5" stroke="#c4654a" />
          <path className="body arm-r" d="M38 30 L44 52" strokeWidth="4.5" stroke="#c4654a" />
          <path className="pants" d="M20 56 L22 96 L28 96 L30 56 Z" />
          <path className="pants" d="M30 56 L32 96 L38 96 L40 56 Z" />
          <ellipse className="shoe" cx="25" cy="98" rx="5" ry="2.5" />
          <ellipse className="shoe" cx="35" cy="98" rx="5" ry="2.5" />
        </svg>
      </div>

      <div className="fig fig-jog">
        <svg viewBox="0 0 60 120">
          <circle className="head" cx="30" cy="16" r="8" />
          <path className="hair" d="M22 14 Q22 6 30 6 Q38 6 38 14 Q34 8 30 8 Q26 8 22 14 Z" />
          <path className="shirt-alt" d="M22 26 L38 26 L40 54 L20 54 Z" />
          <path className="body arm-l" d="M22 30 L14 44" strokeWidth="4.5" stroke="#3f6b9c" />
          <path className="body arm-r" d="M38 30 L46 44" strokeWidth="4.5" stroke="#3f6b9c" />
          <path className="pants" fill="#111827" d="M20 54 L16 92 L28 92 L30 54 Z" />
          <path className="pants" fill="#111827" d="M30 54 L32 92 L44 92 L40 54 Z" />
          <ellipse className="shoe" fill="#e11d48" cx="22" cy="94" rx="6" ry="3" />
          <ellipse className="shoe" fill="#e11d48" cx="38" cy="94" rx="6" ry="3" />
        </svg>
      </div>

      <div className="fig fig-eat">
        <svg viewBox="0 0 80 120">
          <rect x="0" y="82" width="80" height="4" fill="#7a4a2b" />
          <rect x="6" y="86" width="4" height="24" fill="#5a3620" />
          <rect x="70" y="86" width="4" height="24" fill="#5a3620" />
          <ellipse cx="52" cy="80" rx="14" ry="3" fill="#f5f0e8" />
          <ellipse cx="52" cy="79" rx="10" ry="2" fill="#e07a5f" />
          <circle className="head" cx="24" cy="30" r="8" />
          <path className="hair" d="M16 28 Q16 20 24 20 Q32 20 32 28 Q28 22 24 22 Q20 22 16 28 Z" />
          <path className="shirt" d="M16 40 L32 40 L34 72 L14 72 Z" />
          <path className="body arm-l" d="M16 46 L10 62" strokeWidth="4.5" stroke="#c4654a" />
          <path className="body arm-r" d="M32 46 L46 66" strokeWidth="4.5" stroke="#c4654a" />
          <path className="pants" d="M14 72 L14 96 L34 96 L34 72 Z" />
        </svg>
      </div>

      <div className="fig fig-sleep">
        <svg viewBox="0 0 120 80">
          <rect x="4" y="58" width="112" height="14" rx="3" fill="#5a3620" />
          <rect x="4" y="70" width="6" height="8" fill="#3a2210" />
          <rect x="110" y="70" width="6" height="8" fill="#3a2210" />
          <rect x="8" y="52" width="104" height="10" rx="4" fill="#f5f0e8" />
          <rect x="14" y="46" width="26" height="10" rx="5" fill="#ffffff" />
          <path d="M40 52 Q46 44 60 44 L100 44 Q108 44 108 56 L108 62 L40 62 Z" fill="#3f6b9c" />
          <path d="M40 60 L108 60" stroke="#2a4a6c" strokeWidth="1" opacity=".5" />
          <circle className="head" cx="30" cy="46" r="7" />
          <path className="hair" d="M23 46 Q23 39 30 39 Q37 39 37 46 Q33 41 30 41 Q27 41 23 46 Z" />
          <text x="70" y="30" fontSize="14" fill="#e6e6ff" opacity=".8" fontFamily="serif">z</text>
          <text x="82" y="20" fontSize="10" fill="#e6e6ff" opacity=".7" fontFamily="serif">z</text>
          <text x="90" y="12" fontSize="8"  fill="#e6e6ff" opacity=".6" fontFamily="serif">z</text>
        </svg>
      </div>

      <div className="vignette" />

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
  { x: 18, y: 42, d: 1.3 }, { x: 33, y: 40, d: 2.0 }, { x: 66, y: 42, d: 0.8 },
  { x: 84, y: 44, d: 1.9 }, { x: 96, y: 12, d: 0.5 },
];

const MOTE_POSITIONS = [
  { x: 15, y: 55, d: 0 },   { x: 30, y: 70, d: 2 },
  { x: 48, y: 60, d: 4 },   { x: 62, y: 75, d: 1 },
  { x: 78, y: 55, d: 3 },   { x: 88, y: 68, d: 5 },
  { x: 22, y: 78, d: 6 },   { x: 55, y: 82, d: 7 },
];
