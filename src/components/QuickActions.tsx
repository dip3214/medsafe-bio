import { Link } from "@tanstack/react-router";
import { Upload, MessageSquare, Calendar, PenLine } from "lucide-react";
import { useActiveMember } from "@/lib/active-member";

type Action = { to: string; label: string; icon: any; hash?: string };

/**
 * Consistent 4-up "quick action" strip.
 * Pinned at the top of Dashboard / Upload / Lifestyle for muscle-memory
 * access. Same colour intensity as landing-page CTAs.
 */
export function QuickActions({ compact = false }: { compact?: boolean }) {
  const { active } = useActiveMember();
  const isMe = active?.segment === "me";
  const actions: Action[] = [
    { to: "/upload",    label: "Add document",     icon: Upload },
    { to: "/chat",      label: "MedBuddy Assistant",     icon: MessageSquare },
    ...(isMe
      ? [
          { to: "/lifestyle", label: "Log check-in", icon: Calendar, hash: "checkin" },
          { to: "/lifestyle", label: "Log it",       icon: PenLine,  hash: "log" },
        ] as Action[]
      : [
          { to: "/dashboard", label: "Open timeline", icon: Calendar },
        ] as Action[]),
  ];

  return (
    <div className={`sticky top-[64px] z-20 -mx-4 mb-6 px-4 py-2 backdrop-blur ${compact ? "bg-background/70" : "bg-background/85 border-b border-border/40"}`}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
        <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:inline">
          Quick actions
        </span>
        <div className="flex flex-1 flex-wrap gap-2">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                to={a.to}
                hash={a.hash}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 sm:text-sm"
                style={{ background: "oklch(0.42 0.16 28)" }}
              >
                <Icon className="h-3.5 w-3.5" /> {a.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
