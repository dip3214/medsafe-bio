import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listFamilyMembers } from "@/lib/family.functions";
import { supabase } from "@/integrations/supabase/client";

export type Segment = "kids" | "parents" | "me";
export type Member = {
  id: string;
  name: string;
  segment: Segment;
  relation: string | null;
  dob: string | null;
  avatar_color: string | null;
  is_default: boolean;
};

type Ctx = {
  members: Member[];
  active: Member | null;
  activeId: string | null;
  setActiveId: (id: string) => void;
  isLoading: boolean;
  refetch: () => void;
};

const ActiveMemberCtx = createContext<Ctx | null>(null);
const LS_KEY = "medsafe.activeMemberId";

export function ActiveMemberProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  const list = useServerFn(listFamilyMembers);
  const { data: members = [], isLoading, refetch } = useQuery({
    queryKey: ["family-members", authed],
    queryFn: () => list() as Promise<Member[]>,
    enabled: authed,
    staleTime: 30_000,
  });

  const [activeId, _setActiveId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LS_KEY);
  });

  useEffect(() => {
    if (members.length === 0) return;
    if (activeId && members.some((m) => m.id === activeId)) return;
    const def = members.find((m) => m.is_default) || members[0];
    _setActiveId(def.id);
    try {
      localStorage.setItem(LS_KEY, def.id);
    } catch {}
  }, [members, activeId]);

  function setActiveId(id: string) {
    _setActiveId(id);
    try {
      localStorage.setItem(LS_KEY, id);
    } catch {}
  }

  const active = members.find((m) => m.id === activeId) || null;

  return (
    <ActiveMemberCtx.Provider
      value={{ members, active, activeId, setActiveId, isLoading, refetch: () => void refetch() }}
    >
      {children}
    </ActiveMemberCtx.Provider>
  );
}

export function useActiveMember() {
  const c = useContext(ActiveMemberCtx);
  if (!c) return { members: [], active: null, activeId: null, setActiveId: () => {}, isLoading: false, refetch: () => {} } as Ctx;
  return c;
}

export function segmentLabel(s: Segment) {
  return s === "kids" ? "Kids" : s === "parents" ? "Parents" : "Me";
}

export function segmentColor(s: Segment) {
  // Maps to the seg-* tokens we already have
  return s === "kids" ? "bg-kids text-kids-foreground" : s === "parents" ? "bg-parents text-parents-foreground" : "bg-me text-me-foreground";
}
