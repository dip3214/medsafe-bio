import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Plus, MessageSquare, LogOut, LogIn, ShieldCheck, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SEGMENTS = [
  { to: "/", label: "MedSafe Kids", key: "kids" },
  { to: "/services", label: "MedSafe Parents", key: "parents" },
  { to: "/upload", label: "MedSafe Me", key: "me" },
] as const;

const NAV_DESKTOP = [
  { to: "/upload", label: "Upload" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/doctors", label: "Doctors" },
  { to: "/care", label: "Care" },
  { to: "/chat", label: "Ask" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Plus className="h-5 w-5" strokeWidth={3} />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              med<span className="text-primary">Safe</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full bg-secondary/60 p-1 lg:flex">
            {SEGMENTS.map((s) => (
              <Link
                key={s.key}
                to={s.to}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "bg-card text-primary shadow-sm" }}
                activeOptions={{ exact: s.to === "/" }}
              >
                {s.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground/80 md:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
              HIPAA-aligned
            </span>
            <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground/80 md:inline-flex">
              <ShieldCheck className="h-3 w-3" /> ISO 27001
            </span>
            {email ? (
              <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            ) : (
              <Link to="/auth" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <LogIn className="h-3.5 w-3.5" /> Sign in
              </Link>
            )}
          </div>
        </div>

        <div className="border-t border-border/60 lg:hidden">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2">
            {SEGMENTS.concat(NAV_DESKTOP as any).map((n) => (
              <Link key={n.to + n.label} to={n.to as any}
                className="whitespace-nowrap rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground"
                activeProps={{ className: "bg-primary text-primary-foreground" }} activeOptions={{ exact: n.to === "/" }}>
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main>{children}</main>

      {email && (
        <Link
          to="/chat"
          className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/30 hover:bg-primary/90"
        >
          <MessageSquare className="h-4 w-4" /> Ask MedSafe
        </Link>
      )}

      <footer className="mt-16 border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <BadgeCheck className="h-4 w-4 text-primary" />
                MedSafe · One family. One health record.
              </div>
              <div className="mt-1 text-xs">Structured clinical data · AI-grounded chat · Kolkata</div>
            </div>
            <div className="text-xs">© {new Date().getFullYear()} MedSafe · A DeRiskBio initiative</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
