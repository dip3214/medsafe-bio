import { Link } from "@tanstack/react-router";
import { ChevronDown, Users, Plus, UserCog } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useActiveMember, segmentLabel, type Member } from "@/lib/active-member";

export function MemberSwitcher() {
  const { members, active, setActiveId } = useActiveMember();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!active) return null;

  const grouped: Record<string, Member[]> = { me: [], parents: [], kids: [] };
  for (const m of members) grouped[m.segment].push(m);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-sm hover:bg-accent"
      >
        <Avatar member={active} />
        <span className="hidden max-w-[10rem] truncate font-medium md:inline">{active.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
          <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="-mt-0.5 mr-1 inline h-3.5 w-3.5" /> Switch profile
          </div>
          <div className="max-h-80 overflow-y-auto p-1.5">
            {(["me", "parents", "kids"] as const).map((seg) =>
              grouped[seg].length ? (
                <div key={seg} className="mb-1">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {segmentLabel(seg)}
                  </div>
                  {grouped[seg].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setActiveId(m.id);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ${
                        active.id === m.id ? "bg-accent" : ""
                      }`}
                    >
                      <Avatar member={m} />
                      <span className="flex-1 truncate">{m.name}</span>
                      {m.is_default && <span className="text-[10px] text-muted-foreground">default</span>}
                    </button>
                  ))}
                </div>
              ) : null,
            )}
          </div>
          <div className="border-t border-border p-1.5">
            <Link
              to="/members"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" /> Add or manage family
            </Link>
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              <UserCog className="h-3.5 w-3.5" /> Privacy & account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ member }: { member: Member }) {
  const initials = member.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
      style={{ background: member.avatar_color || "#dc2626" }}
    >
      {initials}
    </span>
  );
}
