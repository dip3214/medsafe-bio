import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LogOut, LogIn, ShieldCheck, BadgeCheck, HeartPulse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MemberSwitcher } from "@/components/MemberSwitcher";
import { ConsentBanner } from "@/components/ConsentBanner";
import { useActiveMember } from "@/lib/active-member";

const NAV = [
  { to: "/chat", label: "MedBuddy" },
  { to: "/upload", label: "Upload" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/members", label: "Family" },
  { to: "/doctors", label: "Doctors" },
  { to: "/care", label: "Upcoming" },
] as const;

const LIFESTYLE_NAV = { to: "/lifestyle" as const, label: "Lifestyle" };

export function SiteLayout({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { active } = useActiveMember();
  const navItems = active?.segment === "me" ? [...NAV, LIFESTYLE_NAV] : NAV;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onChatPage = pathname === "/chat";

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
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span
              className="grid h-9 w-9 place-items-center rounded-full text-white shadow-md"
              style={{ background: "oklch(0.42 0.16 28)" }}
            >
              <HeartPulse className="h-5 w-5" />
            </span>
            <span className="text-xl font-semibold tracking-tight">
              med<span style={{ color: "oklch(0.42 0.16 28)" }}>Safe</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full bg-secondary/60 p-1 lg:flex">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "bg-card text-primary shadow-sm" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {email && <MemberSwitcher />}
            <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground/80 xl:inline-flex">
              <ShieldCheck className="h-3 w-3 text-primary" /> Secure platform · DPDP-aligned
            </span>
            {email ? (
              <button
                onClick={signOut}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-white shadow-md transition hover:opacity-90"
                style={{ background: "oklch(0.42 0.16 28)" }}
              >
                <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign out</span>
              </button>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
                style={{ background: "oklch(0.42 0.16 28)" }}
              >
                <LogIn className="h-3.5 w-3.5" /> Sign in
              </Link>
            )}
          </div>
        </div>

        <div className="border-t border-border/60 lg:hidden">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="whitespace-nowrap rounded-full bg-secondary/60 px-3 py-1 text-xs text-muted-foreground"
                activeProps={{ className: "bg-primary text-primary-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="pb-28">{children}</main>

      {/* Floating "Ask MedSafe" removed — the same action lives in the
          pinned QuickActions strip on every logged-in surface. */}


      <footer className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <BadgeCheck className="h-4 w-4 text-primary" />
                MedSafe · One family. One health record.
              </div>
              <div className="mt-1 text-xs">Structured clinical data · AI-grounded chat · Kolkata</div>
            </div>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link to="/dpdp-notice" className="hover:text-foreground">DPDP Notice</Link>
              <Link to="/account" className="hover:text-foreground">Your rights</Link>
              <span>© {new Date().getFullYear()} MedSafe · A DeRiskBio initiative</span>
            </nav>
          </div>
        </div>
      </footer>

      <ConsentBanner />
    </div>
  );
}
