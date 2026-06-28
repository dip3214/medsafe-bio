import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { createChatThread } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const create = useServerFn(createChatThread);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const start = useMutation({
    mutationFn: (title: string) => create({ data: { title } }),
    onSuccess: async ({ id }) => {
      await qc.invalidateQueries({ queryKey: ["chatThreads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: id } });
    },
  });

  const prompts = [
    "Summarise my latest lab report in plain language",
    "Which of my recent values are out of range, and why does it matter?",
    "List all medicines I'm currently taking, with their purpose",
    "Compare my last two visits — what improved, what got worse?",
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
        <Sparkles className="h-7 w-7" />
      </div>
      <div>
        <h1 className="font-display text-3xl text-foreground">Ask MedSafe</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          A private assistant grounded in your own prescriptions and lab reports. Pick a starter or
          ask anything.
        </p>
      </div>
      <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => start.mutate(p.slice(0, 60))}
            disabled={start.isPending}
            className="rounded-lg border border-border bg-background px-4 py-3 text-left text-sm hover:border-primary/40 hover:bg-accent"
          >
            {p}
          </button>
        ))}
      </div>
      <button
        onClick={() => start.mutate("New chat")}
        disabled={start.isPending}
        className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Start a new conversation
      </button>
    </div>
  );
}
