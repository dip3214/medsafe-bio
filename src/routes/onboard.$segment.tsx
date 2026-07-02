import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Baby, HeartHandshake, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { useActiveMember, type Segment } from "@/lib/active-member";
import { createFamilyMember } from "@/lib/family.functions";
import { supabase } from "@/integrations/supabase/client";

const SegmentParam = z.enum(["kids", "parents", "me"]);

export const Route = createFileRoute("/onboard/$segment")({
  parseParams: (p) => ({ segment: SegmentParam.parse(p.segment) }),
  head: () => ({
    meta: [
      { title: "Set up your segment — MedSafe" },
      { name: "description", content: "Add a family member to start tracking their health story." },
    ],
  }),
  component: OnboardPage,
});

const INTRO: Record<Segment, { title: string; desc: string; cta: string; icon: any }> = {
  kids: {
    title: "MedSafe Kids",
    desc: "Vaccination cards, growth charts, allergies and paediatric visits — all held safely in one place from day one.",
    cta: "Add your child",
    icon: Baby,
  },
  parents: {
    title: "MedSafe Parents",
    desc: "A calm companion for ageing parents — medications, BP, sugar and follow-ups organised by visit so nothing slips.",
    cta: "Add a parent",
    icon: HeartHandshake,
  },
  me: {
    title: "MedSafe Me",
    desc: "Every lab, every prescription of yours — organised into visits and trended over time.",
    cta: "Continue",
    icon: HeartHandshake,
  },
};

function OnboardPage() {
  const { segment } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { members, setActiveId, refetch } = useActiveMember();
  const create = useServerFn(createFamilyMember);

  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);

  // Auto-forward if user already has a member for this segment
  useEffect(() => {
    if (!authed) return;
    const existing = members.find((m) => m.segment === segment);
    if (existing) {
      setActiveId(existing.id);
      navigate({ to: "/dashboard" });
    }
  }, [authed, members, segment]);

  const info = INTRO[segment];
  const Icon = info.icon;

  const [name, setName] = useState("");
  const [relation, setRelation] = useState(segment === "kids" ? "Child" : segment === "parents" ? "Parent" : "Self");
  const [dob, setDob] = useState("");

  const addMut = useMutation({
    mutationFn: () => create({ data: { name: name.trim(), segment, relation, dob: dob || undefined } }),
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: ["family-members"] });
      await refetch();
      setActiveId(r.id);
      navigate({ to: "/dashboard" });
    },
  });

  if (authed === null) return null;
  if (!authed) {
    return <Navigate to="/auth" />;
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-4 py-14">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm animate-fade-in">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-7 w-7" />
          </div>
          <div className="mt-4 text-xs uppercase tracking-wider text-primary">{info.title}</div>
          <h1 className="mt-1 font-display text-3xl leading-tight">{info.desc}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Add a profile below — you can add more later, and switch between them anytime from the header.
          </p>

          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) addMut.mutate();
            }}
          >
            <div>
              <label className="text-xs font-medium">Name</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium">Relation</label>
                <input
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  maxLength={40}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Date of birth (optional)</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={addMut.isPending || !name.trim()}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {addMut.isPending ? "Setting up…" : info.cta} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}

