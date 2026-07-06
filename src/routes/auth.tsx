import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/upload" },
  });
  if (error) throw error;
}

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — MedSafe" },
      {
        name: "description",
        content: "Pull the string to turn on the light — then sign in to MedSafe.",
      },
    ],
  }),
  component: AuthPage,
});

const SESSION_KEY = "medsafe:lamp-on";

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [on, setOn] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: (redirect as any) || "/upload" });
    });
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") setOn(true);
    } catch {}
  }, [navigate, redirect]);

  useEffect(() => {
    if (!on) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
  }, [on]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: (redirect as any) || "/upload" });
    } catch (e: any) {
      setErr(e?.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden text-white transition-colors duration-700 ${
        on ? "bg-[#0d0b08]" : "bg-black"
      }`}
    >
      {/* Ambient warm glow when on */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          on ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(60% 60% at 22% 55%, rgba(255,190,110,0.35) 0%, rgba(255,150,60,0.14) 30%, rgba(0,0,0,0) 70%)",
        }}
      />

      {/* Hint text */}
      <div
        className={`absolute left-1/2 top-6 -translate-x-1/2 text-center text-[11px] uppercase tracking-[0.35em] transition-opacity duration-500 ${
          on ? "opacity-30" : "opacity-70"
        }`}
      >
        Pull the string to turn on the light
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-4 px-4 py-16 md:grid-cols-2 md:gap-10">
        {/* Lamp side */}
        <div className="flex flex-col items-center justify-center">
          <Lamp on={on} onToggle={() => setOn((v) => !v)} />
          <div
            className={`mt-8 text-center transition-opacity duration-700 ${
              on ? "opacity-100" : "opacity-40"
            }`}
          >
            <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl">
              Med<span className="text-[#f4b970]">Safe</span>
            </h1>
            <p className="mt-2 text-sm text-white/80">
              Shining light on your scattered health data.
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-white/50">
              One private home for every prescription, lab report and daily check-in.
            </p>
          </div>
          {/* Accessible fallback */}
          <button
            type="button"
            onClick={() => setOn((v) => !v)}
            className="mt-6 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/70 hover:bg-white/10"
          >
            {on ? "Turn light off" : "Turn light on"}
          </button>
        </div>

        {/* Login card side */}
        <div
          className={`transform transition-all duration-700 ${
            on
              ? "translate-y-0 opacity-100 blur-0"
              : "pointer-events-none translate-y-6 opacity-0 blur-md"
          }`}
        >
          <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_-30px_rgba(255,180,90,0.35)] backdrop-blur-xl">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#f4b970]">
                {mode === "signin" ? "Welcome back" : "Create account"}
              </div>
              <h2 className="mt-2 font-display text-2xl text-white">
                {mode === "signin" ? "Sign in to MedSafe" : "Join MedSafe"}
              </h2>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() =>
                  signInWithGoogle().catch((e) => setErr(e?.message || "Google sign-in failed"))
                }
                className="flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white/95 px-4 py-2 text-sm font-medium text-[#1a1a1a] hover:bg-white"
              >
                <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2 14-5.3l-6.5-5.5C29.7 34.9 27 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.6 5C9.6 39.6 16.3 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.7-3.8 5l6.5 5.5C41.8 34.8 44 29.8 44 24c0-1.3-.1-2.3-.4-3.5z" />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/40">
                <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
              </div>

              {mode === "signup" && (
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-white/60">Full name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#f4b970]/60"
                  />
                </div>
              )}
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-white/60">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#f4b970]/60"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-white/60">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#f4b970]/60"
                />
              </div>
              {err && (
                <div className="rounded-md bg-red-500/15 px-3 py-2 text-xs text-red-200">{err}</div>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-gradient-to-b from-[#f4b970] to-[#d68f3a] px-4 py-2 text-sm font-semibold text-[#1a1004] shadow-[0_8px_24px_-8px_rgba(244,185,112,0.6)] hover:brightness-105 disabled:opacity-60"
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Please wait…
                  </span>
                ) : mode === "signin" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </button>
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="w-full text-center text-[11px] text-white/60 hover:text-white"
              >
                {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A stylized floor lamp with a pull-string. Dragging the tassel downward past
 * a threshold toggles the light. Also toggles on tap/click of the tassel.
 */
function Lamp({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const [pull, setPull] = useState(0); // 0..1
  const startY = useRef<number | null>(null);
  const THRESHOLD = 34; // px

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startY.current = e.clientY;
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startY.current == null) return;
    const dy = Math.max(0, Math.min(60, e.clientY - startY.current));
    setPull(dy / 60);
  }
  function onPointerUp(e: React.PointerEvent) {
    const dy = startY.current != null ? e.clientY - startY.current : 0;
    startY.current = null;
    // treat a tap (tiny motion) as a toggle too
    if (dy > THRESHOLD || Math.abs(dy) < 4) onToggle();
    setPull(0);
  }

  const cordExtra = pull * 26; // how much the cord stretches
  const tasselY = 175 + cordExtra;

  return (
    <div className="relative select-none">
      {/* Cone of light */}
      <div
        aria-hidden
        className={`absolute left-1/2 top-[85px] -translate-x-1/2 transition-opacity duration-500 ${
          on ? "opacity-100" : "opacity-0"
        }`}
        style={{
          width: 340,
          height: 320,
          background:
            "conic-gradient(from 180deg at 50% 0%, rgba(255,190,110,0) 340deg, rgba(255,200,130,0.55) 350deg, rgba(255,220,160,0.75) 360deg, rgba(255,200,130,0.55) 10deg, rgba(255,190,110,0) 20deg)",
          filter: "blur(6px)",
          maskImage: "linear-gradient(to bottom, black, transparent 90%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 90%)",
        }}
      />

      <svg
        width="260"
        height="360"
        viewBox="0 0 260 360"
        className="relative"
        aria-hidden
      >
        {/* Ceiling plate */}
        <rect x="110" y="0" width="40" height="6" rx="2" fill="#2a2a2a" />
        {/* Suspension rod */}
        <line x1="130" y1="6" x2="130" y2="70" stroke="#3a3a3a" strokeWidth="3" />
        {/* Lamp shade */}
        <g>
          <path
            d="M70 140 L190 140 L165 70 L95 70 Z"
            fill={on ? "#3a2a1c" : "#2a2a2a"}
            stroke={on ? "#5b3a1e" : "#3a3a3a"}
            strokeWidth="2"
          />
          {/* Inner glow rim */}
          <path
            d="M74 138 L186 138 L182 132 L78 132 Z"
            fill={on ? "#ffcc7a" : "#1a1a1a"}
            opacity={on ? 0.95 : 1}
          />
        </g>
        {/* Bulb halo */}
        {on && (
          <circle cx="130" cy="150" r="22" fill="#ffdca0" opacity="0.9">
            <animate attributeName="r" values="22;24;22" dur="2.2s" repeatCount="indefinite" />
          </circle>
        )}

        {/* Pull cord */}
        <line
          x1="175"
          y1="140"
          x2="175"
          y2={tasselY - 8}
          stroke="#c9a96a"
          strokeWidth="1.5"
        />
      </svg>

      {/* Draggable tassel (positioned over the SVG) */}
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          startY.current = null;
          setPull(0);
        }}
        aria-label={on ? "Pull to turn off the light" : "Pull to turn on the light"}
        className="absolute cursor-grab touch-none active:cursor-grabbing"
        style={{
          left: "calc(50% + 45px)",
          top: tasselY,
          transform: "translate(-50%, 0)",
          transition: startY.current == null ? "top 300ms cubic-bezier(.34,1.56,.64,1)" : "none",
        }}
      >
        <div className="h-5 w-3 rounded-b-full rounded-t-sm bg-gradient-to-b from-[#d4a24a] to-[#8a5a1c] shadow-lg shadow-black/50" />
        <div className="mx-auto -mt-0.5 h-1 w-1 rounded-full bg-[#5a3a12]" />
      </button>
    </div>
  );
}
