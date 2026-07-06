import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { upsertLifestyleLog } from "@/lib/lifestyle.functions";

const MOODS = [
  { v: 1, e: "😣", label: "Rough" },
  { v: 2, e: "😕", label: "Meh" },
  { v: 3, e: "😐", label: "Okay" },
  { v: 4, e: "🙂", label: "Good" },
  { v: 5, e: "😄", label: "Great" },
] as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export function DailyMoodPrompt({ memberId, name }: { memberId: string | null; name?: string | null }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const qc = useQueryClient();
  const upsert = useServerFn(upsertLifestyleLog);

  const today = new Date().toISOString().slice(0, 10);
  const storageKey = `medsafe:mood-prompt:${memberId ?? "self"}:${today}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!memberId) return;
    try {
      if (!localStorage.getItem(storageKey)) {
        // small delay so it doesn't slam in on paint
        const t = setTimeout(() => setOpen(true), 500);
        return () => clearTimeout(t);
      }
    } catch {}
  }, [storageKey, memberId]);

  const save = useMutation({
    mutationFn: (mood: number) => upsert({ data: { mood, source: "mood" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lifestyle-logs"] });
      dismiss();
    },
  });

  function dismiss() {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {}
    setOpen(false);
    setPicked(null);
  }

  const first = name?.split(/\s+/)[0];

  return (
    <Dialog.Root open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl animate-scale-in">
          <Dialog.Title className="font-display text-2xl">
            {greeting()}{first ? `, ${first}` : ""}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            How was your day? Tap a face — it takes a second and helps MedSafe understand your rhythm.
          </Dialog.Description>

          <div className="mt-5 flex items-center justify-between gap-1">
            {MOODS.map((m) => (
              <button
                key={m.v}
                type="button"
                onClick={() => setPicked(m.v)}
                aria-label={m.label}
                className={`group flex flex-1 flex-col items-center gap-1 rounded-xl border px-1 py-2.5 transition ${
                  picked === m.v
                    ? "border-primary bg-primary/10 scale-105"
                    : "border-transparent hover:bg-secondary"
                }`}
              >
                <span className="text-3xl leading-none transition-transform group-hover:scale-110">{m.e}</span>
                <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md border border-border bg-background px-4 py-2 text-xs font-medium hover:bg-accent"
            >
              Skip today
            </button>
            <button
              type="button"
              onClick={() => picked && save.mutate(picked)}
              disabled={!picked || save.isPending}
              className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {save.isPending ? "Saving…" : "Save mood"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
