import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { Activity, Loader2 } from "lucide-react";

async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/upload" },
  });
  if (error) throw error;
}

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({ meta: [{ title: "Sign in — MedSafe" }] }),
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
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
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
    <SiteLayout>
      <section className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Activity className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold">{mode === "signin" ? "Welcome back" : "Create your MedSafe account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground text-center">
          {mode === "signin" ? "Sign in to access your structured health records." : "You'll be set up as a patient by default. Doctors & admins are upgraded by the MedSafe team."}
        </p>

        <form onSubmit={submit} className="mt-8 w-full space-y-3 rounded-2xl border border-border bg-card p-6">
          <button
            type="button"
            onClick={() => signInWithGoogle().catch((e) => setErr(e?.message || "Google sign-in failed"))}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2 14-5.3l-6.5-5.5C29.7 34.9 27 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.6 5C9.6 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.7-3.8 5l6.5 5.5C41.8 34.8 44 29.8 44 24c0-1.3-.1-2.3-.4-3.5z"/>
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>
          {mode === "signup" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {err && <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</div>}
          <button type="submit" disabled={busy} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {busy ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Please wait…</span> : (mode === "signin" ? "Sign in" : "Create account")}
          </button>
          <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </form>
      </section>
    </SiteLayout>
  );
}
