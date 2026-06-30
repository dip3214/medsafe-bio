import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, CheckCircle2, Upload as UploadIcon } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { useActiveMember, segmentLabel, type Segment, type Member } from "@/lib/active-member";
import { createFamilyMember, deleteFamilyMember } from "@/lib/family.functions";

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({
    meta: [
      { title: "Family profiles — MedSafe" },
      { name: "description", content: "Create separate health profiles for kids, parents and yourself. Switch between them to keep each person's records distinct." },
    ],
  }),
  component: MembersPage,
});

function MembersPage() {
  const { members, activeId, setActiveId, refetch } = useActiveMember();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useServerFn(createFamilyMember);
  const del = useServerFn(deleteFamilyMember);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", segment: "me" as Segment, relation: "" });

  const createMut = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["family-members"] });
      refetch();
      setOpen(false);
      setForm({ name: "", segment: "me", relation: "" });
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["family-members"] });
      refetch();
    },
  });

  const grouped: Record<Segment, Member[]> = { me: [], parents: [], kids: [] };
  for (const m of members) grouped[m.segment].push(m);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-primary">Family</div>
            <h1 className="mt-1 font-display text-3xl">Profiles under your account</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Each profile keeps its own records, labs, medicines and chat history. Switch between
              them anytime from the header.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add profile
          </button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {(["me", "parents", "kids"] as const).map((seg) => (
            <div key={seg} className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {segmentLabel(seg)}
              </div>
              <ul className="mt-3 space-y-2">
                {grouped[seg].length === 0 && (
                  <li className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                    No {segmentLabel(seg).toLowerCase()} profiles yet.
                  </li>
                )}
                {grouped[seg].map((m) => (
                  <li
                    key={m.id}
                    className={`flex items-center gap-3 rounded-md border p-3 transition ${
                      activeId === m.id ? "border-primary/60 bg-primary/5" : "border-border bg-background"
                    }`}
                  >
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                      style={{ background: m.avatar_color || "#dc2626" }}
                    >
                      {m.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.relation || segmentLabel(m.segment)} {m.is_default && "· default"}
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveId(m.id)}
                      className="rounded-md p-1.5 text-xs text-muted-foreground hover:text-primary"
                      title="Make active"
                    >
                      <CheckCircle2 className={`h-4 w-4 ${activeId === m.id ? "text-primary" : ""}`} />
                    </button>
                    <button
                      onClick={() => { setActiveId(m.id); navigate({ to: "/upload" }); }}
                      className="rounded-md p-1.5 text-xs text-muted-foreground hover:text-primary"
                      title={`Upload to ${m.name}`}
                    >
                      <UploadIcon className="h-4 w-4" />
                    </button>
                    {!m.is_default && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${m.name}'s profile? Their records will detach but not be deleted.`)) {
                            delMut.mutate(m.id);
                          }
                        }}
                        className="rounded-md p-1.5 text-xs text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {open && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-scale-in">
              <h2 className="font-display text-xl">Add a profile</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Give them a unique identity under your account.
              </p>
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (form.name.trim()) createMut.mutate();
                }}
              >
                <div>
                  <label className="text-xs font-medium">Name</label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    maxLength={80}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Segment</label>
                  <div className="mt-1 flex gap-2">
                    {(["me", "parents", "kids"] as const).map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setForm({ ...form, segment: s })}
                        className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
                          form.segment === s ? "border-primary bg-primary/10 text-primary" : "border-border"
                        }`}
                      >
                        {segmentLabel(s)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">Relation (optional)</label>
                  <input
                    value={form.relation}
                    onChange={(e) => setForm({ ...form, relation: e.target.value })}
                    placeholder="e.g. Mother, Son, Spouse"
                    maxLength={40}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md border border-border px-3 py-1.5 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMut.isPending}
                    className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {createMut.isPending ? "Adding…" : "Add profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
