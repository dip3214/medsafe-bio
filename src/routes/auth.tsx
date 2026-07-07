import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, HeartPulse, ShieldCheck, Sparkles } from "lucide-react";

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
        content: "Sign in to MedSafe — one private home for every prescription, lab report and daily check-in.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
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
  }, [navigate, redirect]);

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
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Soft ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 15% 20%, color-mix(in oklch, var(--primary) 12%, transparent), transparent 70%), radial-gradient(50% 40% at 90% 90%, color-mix(in oklch, var(--primary) 8%, transparent), transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2">
        {/* Brand + healthcare animation side */}
        <div className="flex flex-col items-center justify-center text-center md:items-start md:text-left">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>

          <HeartbeatAnimation />

          <h1 className="mt-8 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
            Med<span className="text-primary">Safe</span>
          </h1>
          <p className="mt-3 max-w-md text-base text-muted-foreground">
            One private home for every prescription, lab report and daily check-in — kept safely for you and your family.
          </p>

          <ul className="mt-6 grid gap-2 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Encrypted, DPDP-compliant storage</li>
            <li className="inline-flex items-center gap-2"><HeartPulse className="h-4 w-4 text-primary" /> Personalised health summaries</li>
            <li className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Daily lifestyle coaching</li>
          </ul>
        </div>

        {/* Login card side */}
        <div>
          <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
            <div className="text-center">
              <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
                {mode === "signin" ? "Welcome back" : "Create account"}
              </div>
              <h2 className="mt-2 font-serif text-2xl text-foreground">
                {mode === "signin" ? "Sign in to MedSafe" : "Join MedSafe"}
              </h2>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() =>
                  signInWithGoogle().catch((e) => setErr(e?.message || "Google sign-in failed"))
                }
                className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
              >
                <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2 14-5.3l-6.5-5.5C29.7 34.9 27 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.6 5C9.6 39.6 16.3 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.7-3.8 5l6.5 5.5C41.8 34.8 44 29.8 44 24c0-1.3-.1-2.3-.4-3.5z" />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-2 py-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
              </div>

              {mode === "signup" && (
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Full name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {err && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? (
                  <span className="inline-flex items-center justify-center gap-2">
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
                className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground"
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

/** Animated ECG / heartbeat line — healthcare motif that matches site colors. */
function HeartbeatAnimation() {
  return (
    <div className="relative w-full max-w-md">
      <svg viewBox="0 0 400 140" className="w-full" aria-hidden>
        <defs>
          <linearGradient id="ecgFade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="20%" stopColor="var(--primary)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Faint baseline grid */}
        <g stroke="currentColor" strokeOpacity="0.06">
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="140" />
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 35} x2="400" y2={i * 35} />
          ))}
        </g>

        {/* ECG trace */}
        <path
          d="M0,70 L80,70 L100,70 L110,60 L120,80 L130,20 L140,110 L150,70 L200,70 L220,70 L230,60 L240,80 L250,20 L260,110 L270,70 L320,70 L340,60 L350,70 L400,70"
          fill="none"
          stroke="url(#ecgFade)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="600"
          strokeDashoffset="600"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="600"
            to="0"
            dur="3.2s"
            repeatCount="indefinite"
          />
        </path>

        {/* Heart at the end, gently pulsing */}
        <g transform="translate(360,70)">
          <path
            d="M0,-6 C-8,-16 -22,-8 0,10 C22,-8 8,-16 0,-6 Z"
            fill="var(--primary)"
            opacity="0.9"
          >
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1;1.18;1;1.1;1"
              keyTimes="0;0.15;0.4;0.55;1"
              dur="1.1s"
              repeatCount="indefinite"
              additive="sum"
            />
          </path>
        </g>
      </svg>
    </div>
  );
}
