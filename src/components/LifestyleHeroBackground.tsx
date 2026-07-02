export function LifestyleHeroBackground() {
  return (
    <div aria-hidden className="lifestyle-hero pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        .lifestyle-hero { --sky-1:#fde3d2; --sky-2:#f6c9c9; --sky-3:#e8dcd0; }
        @media (prefers-color-scheme: dark) {
          .lifestyle-hero { --sky-1:#3a2124; --sky-2:#2a171a; --sky-3:#1a1214; }
        }
        .lifestyle-hero .sky {
          position:absolute; inset:0;
          background: linear-gradient(180deg, var(--sky-1) 0%, var(--sky-2) 55%, var(--sky-3) 100%);
        }
        .lifestyle-hero .sun {
          position:absolute; left:12%; top:22%; width:120px; height:120px; border-radius:50%;
          background: radial-gradient(circle, rgba(255,236,210,.95), rgba(255,180,150,.55) 55%, transparent 70%);
          filter: blur(2px);
        }
        .lifestyle-hero .ground {
          position:absolute; left:0; right:0; bottom:0; height:38%;
          background: linear-gradient(180deg, transparent 0%, rgba(60,30,30,.08) 30%, rgba(40,20,20,.18) 100%);
        }
        .lifestyle-hero .path {
          position:absolute; left:-5%; right:-5%; bottom:8%; height:2px; background: rgba(120,60,40,.25);
          transform: rotate(-1.2deg);
        }
        .lifestyle-hero .cloud {
          position:absolute; top:12%; width:180px; height:44px; border-radius:999px;
          background: rgba(255,255,255,.55); filter: blur(1px);
          animation: ls-drift 60s linear infinite;
        }
        .lifestyle-hero .cloud.c2 { top:24%; width:120px; height:32px; opacity:.7; animation-duration:80s; animation-delay:-20s;}
        .lifestyle-hero .cloud.c3 { top:8%; width:220px; height:52px; opacity:.5; animation-duration:100s; animation-delay:-45s;}
        @keyframes ls-drift {
          0% { transform: translateX(-20vw); }
          100% { transform: translateX(120vw); }
        }
        .lifestyle-hero .fig { position:absolute; bottom:12%; width:60px; height:110px; opacity:.85; }
        .lifestyle-hero .fig svg { width:100%; height:100%; overflow:visible; }
        .lifestyle-hero .fig .body { fill: none; stroke: rgba(60,20,20,.55); stroke-width:2.5; stroke-linecap:round; stroke-linejoin:round; }
        .lifestyle-hero .fig .head { fill: rgba(60,20,20,.55); }
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
        .lifestyle-hero .fig-jog .leg-l, .lifestyle-hero .fig-jog .arm-l { animation-duration: 0.5s; }
        .lifestyle-hero .fig-jog .leg-r, .lifestyle-hero .fig-jog .arm-r { animation-duration: 0.5s; }
        .lifestyle-hero .fig-yoga .leg-l, .lifestyle-hero .fig-yoga .leg-r,
        .lifestyle-hero .fig-yoga .arm-l, .lifestyle-hero .fig-yoga .arm-r { animation: none; }
        @keyframes ls-limb { from { transform: rotate(-14deg);} to { transform: rotate(14deg);} }
        @media (prefers-reduced-motion: reduce) {
          .lifestyle-hero .cloud, .lifestyle-hero .fig, .lifestyle-hero .fig *,
          .lifestyle-hero .fig-yoga { animation: none !important; }
        }
      `}</style>
      <div className="sky" />
      <div className="sun" />
      <div className="cloud" style={{ left: "10%" }} />
      <div className="cloud c2" style={{ left: "45%" }} />
      <div className="cloud c3" style={{ left: "60%" }} />
      <div className="ground" />
      <div className="path" />

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
    </div>
  );
}
